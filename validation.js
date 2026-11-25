import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const phone = z.string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ''))
  .pipe(z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone number'));

export const productQuerySchema = z.object({
  brand: z.string().trim().min(1).max(80).optional(),
  search: z.string().trim().max(120).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  page: z.coerce.number().int().min(1).default(1),
}).refine(
  (value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice,
  { path: ['maxPrice'], message: 'Maximum price must be greater than or equal to minimum price' },
);

export const productIdSchema = z.object({ id: objectId });

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone,
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/\d/).regex(/[^A-Za-z0-9]/),
});

export const loginSchema = z.object({
  phone,
  password: z.string().min(1).max(128),
});

const productFieldsSchema = z.object({
  brand: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(120),
  ram: z.string().trim().min(1).max(30),
  storage: z.string().trim().min(1).max(30),
  battery: z.string().trim().min(1).max(30),
  priceInr: z.number().int().positive().max(10_000_000).optional(),
  price: z.number().int().positive().max(10_000_000).optional(),
  imageUrl: z.string().url().max(2048).optional(),
  image: z.string().url().max(2048).optional(),
  description: z.string().trim().max(2000).optional().default(''),
}).refine((value) => value.priceInr !== undefined || value.price !== undefined, {
  path: ['priceInr'],
  message: 'A valid INR price is required',
});

export const createProductSchema = productFieldsSchema.transform((value) => ({
  brand: value.brand,
  model: value.model,
  ram: value.ram,
  storage: value.storage,
  battery: value.battery,
  priceInr: value.priceInr ?? value.price,
  imageUrl: value.imageUrl ?? value.image ?? '',
  description: value.description,
}));

export const createProductRequestSchema = z.union([
  z.object({
    product: createProductSchema,
    image: z.string().url().max(2048).optional(),
  }).transform(({ product, image }) => ({
    ...product,
    imageUrl: image ?? product.imageUrl,
  })),
  createProductSchema,
]);

export const uploadSchema = z.object({
  image: z.string().min(1).max(14_000_000),
});

const orderItemSchema = z.union([
  z.object({ productId: objectId, quantity: z.number().int().min(1).max(10) }),
  z.object({
    product: z.object({ id: objectId }),
    quantity: z.number().int().min(1).max(10),
  }).transform(({ product, quantity }) => ({ productId: product.id, quantity })),
]);

const fulfillmentSchema = z.union([
  z.enum(['delivery', 'pickup']),
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('delivery'),
      address: z.string().trim().min(5).max(300).optional(),
      postalCode: z.string().regex(/^\d{6}$/).optional(),
    }),
    z.object({ type: z.literal('pickup'), store: z.string().trim().min(2).max(120).optional() }),
  ]),
]);

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1).max(20),
  fulfillment: fulfillmentSchema,
  amount: z.number().int().positive(),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1).max(128),
  paymentId: z.string().min(1).max(128),
  signature: z.string().min(1).max(256),
});

export const serviceRequestSchema = z.object({
  type: z.enum(['repair', 'trade-in']),
  device: z.string().trim().min(2).max(120),
  imei: z.string().regex(/^\d{15}$/, 'IMEI must be exactly 15 digits'),
  details: z.string().trim().min(5).max(2000),
  name: z.string().trim().min(2).max(100).optional(),
}).transform(({ name: _name, ...request }) => request);

export const serviceRequestIdSchema = z.object({ id: objectId });
