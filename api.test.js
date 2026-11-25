import { afterEach, describe, expect, it, jest } from '@jest/globals';
import pino from 'pino';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { AppError, ERROR_CODES } from '../src/errors/app-error.js';
import { CloudinaryMediaService } from '../src/services/media-service.js';
import { RazorpayPaymentService } from '../src/services/payment-service.js';

function createTestApp() {
  const services = {
    database: { healthCheck: jest.fn(async () => true) },
    auth: {
      register: jest.fn(async (input) => ({
        user: { id: 'user-1', name: input.name, phone: input.phone, email: input.email, role: 'customer' },
        token: 'signed-test-token',
      })),
      login: jest.fn(),
      authenticate: jest.fn(async (token) => {
        if (token === 'admin-token') return { id: 'admin-1', role: 'admin' };
        if (token === 'customer-token') return { id: 'customer-1', role: 'customer' };
        throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid token');
      }),
    },
    products: {
      listProducts: jest.fn(async () => ({ products: [{ id: 'product-1' }], count: 1 })),
      getProduct: jest.fn(async (id) => ({ id })),
      createProduct: jest.fn(async (product) => ({
        id: 'product-2',
        ...product,
        price: product.priceInr,
        image: product.imageUrl,
      })),
    },
    media: { upload: jest.fn(async () => 'https://cdn.example.test/image.webp'), healthCheck: jest.fn(async () => false) },
    payments: {
      createOrder: jest.fn(async () => ({ id: 'order-1' })),
      verifyPayment: jest.fn(async () => ({ verified: true, order: { id: 'order-1' } })),
      healthCheck: jest.fn(async () => false),
    },
    serviceRequests: {
      createRequest: jest.fn(async (_userId, input) => ({ id: 'request-1', ...input })),
      listRequests: jest.fn(async () => []),
    },
    blobStorage: { healthCheck: jest.fn(async () => false) },
  };
  const app = createApp({
    config: { corsOrigins: ['http://localhost:5173'] },
    services,
    logger: pino({ level: 'silent' }),
  });
  return { app, services };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Mobile Store API', () => {
  it('reports 503 unhealthy when MongoDB is unavailable', async () => {
    const { app, services } = createTestApp();
    services.database.healthCheck.mockResolvedValue(false);

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('unhealthy');
    expect(response.body.services.api).toBe(true);
    expect(response.body.services.mongodb).toBe(false);
  });

  it('reports 200 degraded when MongoDB is healthy but optional providers are down', async () => {
    const { app } = createTestApp();

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('degraded');
    expect(response.body.services.mongodb).toBe(true);
    expect(response.body.services.cloudinary).toBe(false);
  });

  it('allows public product listing and returns the planned envelope', async () => {
    const { app, services } = createTestApp();

    const response = await request(app).get('/api/products?search=Pixel');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ products: [{ id: 'product-1' }], count: 1 });
    expect(services.products.listProducts).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Pixel', page: 1, limit: 50 }),
    );
  });

  it('allows public product detail reads', async () => {
    const { app, services } = createTestApp();

    const response = await request(app).get('/api/products/507f1f77bcf86cd799439011');

    expect(response.status).toBe(200);
    expect(response.body.product.id).toBe('507f1f77bcf86cd799439011');
    expect(services.products.getProduct).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('returns standardized validation errors for invalid registration input', async () => {
    const { app, services } = createTestApp();

    const response = await request(app).post('/api/auth/register').send({
      name: 'Asha Rao',
      phone: '+919876543210',
      email: 'asha@example.com',
      password: 'weak',
      role: 'admin',
    });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'password' }),
    ]));
    expect(services.auth.register).not.toHaveBeenCalled();
  });

  it('creates customer accounts without accepting a client-supplied role', async () => {
    const { app, services } = createTestApp();

    const response = await request(app).post('/api/auth/register').send({
      name: 'Asha Rao',
      phone: '+91 98765 43210',
      email: 'asha@example.com',
      password: 'StrongPass123!',
      role: 'admin',
    });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('customer');
    expect(services.auth.register.mock.calls[0][0]).not.toHaveProperty('role');
    expect(services.auth.register.mock.calls[0][0].phone).toBe('+919876543210');
  });

  it('rejects unauthenticated service requests and validates exactly 15 IMEI digits', async () => {
    const { app, services } = createTestApp();
    const body = { type: 'repair', device: 'iPhone 15', imei: '12345678901234', details: 'Screen replacement' };

    const unauthorized = await request(app).post('/api/services/requests').send(body);
    const invalidImei = await request(app)
      .post('/api/services/requests')
      .set('Authorization', 'Bearer customer-token')
      .send(body);

    expect(unauthorized.status).toBe(401);
    expect(unauthorized.body.error.code).toBe('UNAUTHORIZED');
    expect(invalidImei.status).toBe(422);
    expect(invalidImei.body.error.details).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'imei' }),
    ]));
    expect(services.serviceRequests.createRequest).not.toHaveBeenCalled();
  });

  it('does not trust a submitted service-request name and accepts a valid IMEI', async () => {
    const { app, services } = createTestApp();

    const response = await request(app)
      .post('/api/services/requests')
      .set('Authorization', 'Bearer customer-token')
      .send({
        type: 'trade-in',
        device: 'Pixel 8',
        imei: '354916820417269',
        details: 'Request a trade-in estimate',
        name: 'Someone Else',
      });

    expect(response.status).toBe(201);
    expect(services.serviceRequests.createRequest).toHaveBeenCalledWith('customer-1', {
      type: 'trade-in',
      device: 'Pixel 8',
      imei: '354916820417269',
      details: 'Request a trade-in estimate',
    });
  });

  it('requires an administrator for product creation and service-lead listing', async () => {
    const { app, services } = createTestApp();
    const product = {
      brand: 'Samsung',
      model: 'Galaxy S24',
      ram: '8 GB',
      storage: '256 GB',
      battery: '4000 mAh',
      price: 61999,
    };

    const createResponse = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer customer-token')
      .send({ product });
    const leadsResponse = await request(app)
      .get('/api/admin/services')
      .set('Authorization', 'Bearer customer-token');

    expect(createResponse.status).toBe(403);
    expect(leadsResponse.status).toBe(403);
    expect(services.products.createProduct).not.toHaveBeenCalled();
    expect(services.serviceRequests.listRequests).not.toHaveBeenCalled();
  });

  it('returns standardized 503 responses when optional upload and payment providers are not configured', async () => {
    const { app, services } = createTestApp();
    services.media = new CloudinaryMediaService({
      config: { cloudinary: { cloudName: '', apiKey: '', apiSecret: '' } },
    });
    services.payments = new RazorpayPaymentService({
      config: { razorpay: { keyId: '', keySecret: '' } },
      Order: {},
      Product: {},
    });

    const uploadResponse = await request(app)
      .post('/api/upload')
      .set('Authorization', 'Bearer admin-token')
      .send({ image: 'data:image/png;base64,abc' });
    const orderResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer customer-token')
      .send({
        items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
        fulfillment: 'pickup',
        amount: 1000,
      });

    expect(uploadResponse.status).toBe(503);
    expect(uploadResponse.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(orderResponse.status).toBe(503);
    expect(orderResponse.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('supports admin product creation with the product contract', async () => {
    const { app, services } = createTestApp();
    const product = {
      brand: 'Samsung',
      model: 'Galaxy S24',
      ram: '8 GB',
      storage: '256 GB',
      battery: '4000 mAh',
      price: 61999,
    };

    const response = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer admin-token')
      .send({ product });

    expect(response.status).toBe(201);
    expect(services.products.createProduct).toHaveBeenCalledWith(expect.objectContaining({
      priceInr: 61999,
      imageUrl: '',
    }));
    expect(response.body.product.price).toBe(61999);
  });

  it('publishes an OpenAPI specification for all API routes', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/api/openapi.json');

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.paths)).toEqual(expect.arrayContaining([
      '/health',
      '/products',
      '/products/{id}',
      '/auth/register',
      '/auth/login',
      '/auth/me',
      '/upload',
      '/orders',
      '/payments/verify',
      '/services/requests',
      '/admin/services',
    ]));
  });
});
