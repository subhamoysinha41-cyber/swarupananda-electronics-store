import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import {
  createOrderSchema,
  createProductRequestSchema,
  loginSchema,
  productIdSchema,
  productQuerySchema,
  registerSchema,
  serviceRequestSchema,
  uploadSchema,
  verifyPaymentSchema,
} from '@mobile-store/shared/schemas/validation.js';
import { AppError, ERROR_CODES } from '../errors/app-error.js';
import { openApiSpec } from '../openapi.js';
import { createAuthenticationMiddleware } from '../middleware/authenticate.js';
import { requireDatabase } from '../middleware/require-database.js';
import { validateRequest } from '../middleware/validate-request.js';

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return callback(new AppError(422, ERROR_CODES.VALIDATION_ERROR, 'Upload a JPEG, PNG, or WebP image'));
    }
    return callback(null, true);
  },
});

export function createApiRouter({ services }) {
  const router = Router();
  const database = requireDatabase(services.database);
  const { authenticate, requireAdmin } = createAuthenticationMiddleware(services.auth);
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({
      error: {
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
        message: 'Too many authentication attempts; try again later',
        details: null,
      },
    }),
  });

  router.get('/health', async (_req, res) => {
    const checks = await Promise.all([
      safeHealthCheck(services.database),
      safeHealthCheck(services.auth),
      safeHealthCheck(services.media),
      safeHealthCheck(services.payments),
      safeHealthCheck(services.blobStorage),
    ]);
    const [mongodb, authentication, cloudinary, razorpay, azureBlob] = checks;
    const optionalHealthy = cloudinary && razorpay && azureBlob;
    const status = !mongodb ? 'unhealthy' : authentication && optionalHealthy ? 'healthy' : 'degraded';
    return res.status(mongodb ? 200 : 503).json({
      status,
      services: { api: true, mongodb, authentication, cloudinary, razorpay, azureBlob },
    });
  });

  router.get('/openapi.json', (_req, res) => res.json(openApiSpec));

  router.get('/products', database, validateRequest(productQuerySchema, 'query'), async (req, res) => {
    const result = await services.products.listProducts(req.validated.query);
    return res.json(result);
  });

  router.get('/products/:id', database, validateRequest(productIdSchema, 'params'), async (req, res) => {
    const product = await services.products.getProduct(req.validated.params.id);
    return res.json({ product });
  });

  router.post(
    '/auth/register',
    database,
    validateRequest(registerSchema),
    async (req, res) => res.status(201).json(await services.auth.register(req.validated.body)),
  );

  router.post(
    '/auth/login',
    loginLimiter,
    database,
    validateRequest(loginSchema),
    async (req, res) => res.json(await services.auth.login(req.validated.body)),
  );

  router.get('/auth/me', database, authenticate, (req, res) => res.json({ user: req.user }));

  router.post(
    '/products',
    database,
    authenticate,
    requireAdmin,
    validateRequest(createProductRequestSchema),
    async (req, res) => {
      const product = await services.products.createProduct(req.validated.body);
      return res.status(201).json({ product });
    },
  );

  router.post(
    '/upload',
    database,
    authenticate,
    requireAdmin,
    imageUpload.single('image'),
    async (req, res) => {
      if (req.file) {
        const imageUrl = await services.media.upload(undefined, req.file);
        return res.json({ imageUrl });
      }
      const result = uploadSchema.safeParse(req.body);
      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        throw new AppError(422, ERROR_CODES.VALIDATION_ERROR, 'Request validation failed', details);
      }
      const imageUrl = await services.media.upload(result.data.image);
      return res.json({ imageUrl });
    },
  );

  router.post(
    '/orders',
    database,
    authenticate,
    validateRequest(createOrderSchema),
    async (req, res) => {
      const order = await services.payments.createOrder(req.user.id, req.validated.body);
      return res.status(201).json({ order });
    },
  );

  router.post(
    '/payments/verify',
    database,
    authenticate,
    validateRequest(verifyPaymentSchema),
    async (req, res) => {
      const result = await services.payments.verifyPayment(req.user.id, req.validated.body);
      return res.json(result);
    },
  );

  router.post(
    '/services/requests',
    database,
    authenticate,
    validateRequest(serviceRequestSchema),
    async (req, res) => {
      const serviceRequest = await services.serviceRequests.createRequest(
        req.user.id,
        req.validated.body,
      );
      return res.status(201).json({ serviceRequest });
    },
  );

  router.get(
    '/admin/services',
    database,
    authenticate,
    requireAdmin,
    async (_req, res) => res.json({ requests: await services.serviceRequests.listRequests() }),
  );

  return router;
}

async function safeHealthCheck(service) {
  try {
    return Boolean(service && await service.healthCheck());
  } catch {
    return false;
  }
}
