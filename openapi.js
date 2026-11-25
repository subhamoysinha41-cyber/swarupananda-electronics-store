const json = (schema) => ({ 'application/json': { schema } });
const response = (description, schema) => ({ description, content: json(schema) });
const envelope = (key, schema) => ({
  type: 'object',
  required: [key],
  properties: { [key]: schema },
});
const errorResponse = {
  type: 'object',
  required: ['error'],
  properties: {
    error: {
      type: 'object',
      required: ['code', 'message', 'details'],
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: { nullable: true },
      },
    },
  },
};
const errors = {
  '400': response('Malformed request', errorResponse),
  '401': response('Authentication required or token invalid', errorResponse),
  '403': response('Insufficient permissions or invalid payment signature', errorResponse),
  '404': response('Resource not found', errorResponse),
  '409': response('Resource conflict', errorResponse),
  '422': response('Request validation failed', errorResponse),
  '503': response('Database or optional provider unavailable', errorResponse),
};
const secured = [{ bearerAuth: [] }];
const productSchema = {
  type: 'object',
  required: ['id', 'brand', 'model', 'ram', 'storage', 'battery', 'priceInr', 'imageUrl'],
  properties: {
    id: { type: 'string' },
    brand: { type: 'string' },
    model: { type: 'string' },
    ram: { type: 'string' },
    storage: { type: 'string' },
    battery: { type: 'string' },
    priceInr: { type: 'integer' },
    imageUrl: { type: 'string', description: 'Public image URL; empty when no image is configured' },
    price: { type: 'integer' },
    image: { type: 'string', description: 'Compatibility image URL field' },
    description: { type: 'string' },
  },
};
const productInputSchema = {
  type: 'object',
  required: ['brand', 'model', 'ram', 'storage', 'battery'],
  properties: {
    brand: { type: 'string', minLength: 1, maxLength: 80 },
    model: { type: 'string', minLength: 1, maxLength: 120 },
    ram: { type: 'string', minLength: 1, maxLength: 30 },
    storage: { type: 'string', minLength: 1, maxLength: 30 },
    battery: { type: 'string', minLength: 1, maxLength: 30 },
    priceInr: { type: 'integer', minimum: 1, maximum: 10000000 },
    price: { type: 'integer', minimum: 1, maximum: 10000000 },
    imageUrl: { type: 'string', format: 'uri' },
    image: { type: 'string', format: 'uri' },
    description: { type: 'string', maxLength: 2000 },
  },
  anyOf: [{ required: ['priceInr'] }, { required: ['price'] }],
};
const registerRequestSchema = {
  type: 'object',
  required: ['name', 'phone', 'email', 'password'],
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 100 },
    phone: { type: 'string', pattern: '^\\+?[1-9]\\d{7,14}$' },
    email: { type: 'string', format: 'email', maxLength: 254 },
    password: { type: 'string', minLength: 12, maxLength: 128 },
  },
};
const loginRequestSchema = {
  type: 'object',
  required: ['phone', 'password'],
  properties: {
    phone: { type: 'string', pattern: '^\\+?[1-9]\\d{7,14}$' },
    password: { type: 'string', minLength: 1, maxLength: 128 },
  },
};
const orderRequestSchema = {
  type: 'object',
  required: ['items', 'fulfillment', 'amount'],
  properties: {
    items: {
      type: 'array',
      minItems: 1,
      maxItems: 20,
      items: {
        oneOf: [
          {
            type: 'object',
            required: ['productId', 'quantity'],
            properties: { productId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' }, quantity: { type: 'integer', minimum: 1, maximum: 10 } },
          },
          {
            type: 'object',
            required: ['product', 'quantity'],
            properties: {
              product: { type: 'object', required: ['id'], properties: { id: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } } },
              quantity: { type: 'integer', minimum: 1, maximum: 10 },
            },
          },
        ],
      },
    },
    fulfillment: {
      oneOf: [
        { type: 'string', enum: ['delivery', 'pickup'] },
        { type: 'object', required: ['type'], properties: { type: { type: 'string', enum: ['delivery', 'pickup'] } } },
      ],
    },
    amount: { type: 'integer', minimum: 1 },
  },
};

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Mobile Store API',
    version: '1.0.0',
    description: 'Store catalog, customer authentication, checkout, and service requests.',
  },
  servers: [{ url: '/api' }],
  paths: {
    '/openapi.json': {
      get: {
        operationId: 'getOpenApiSpec',
        responses: {
          '200': response('OpenAPI 3 specification', { type: 'object' }),
        },
      },
    },
    '/health': {
      get: {
        operationId: 'getHealth',
        responses: {
          '200': response('Healthy or degraded service status', {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['healthy', 'degraded'] },
              services: { type: 'object', additionalProperties: { type: 'boolean' } },
            },
          }),
          '503': response('Essential service unavailable', {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['unhealthy'] },
              services: { type: 'object', additionalProperties: { type: 'boolean' } },
            },
          }),
        },
      },
    },
    '/products': {
      get: {
        operationId: 'listProducts',
        parameters: [
          { in: 'query', name: 'brand', schema: { type: 'string' } },
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'minPrice', schema: { type: 'integer', minimum: 0 } },
          { in: 'query', name: 'maxPrice', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 } },
        ],
        responses: {
          '200': response('Product page', {
            type: 'object',
            properties: { products: { type: 'array', items: productSchema }, count: { type: 'integer' } },
          }),
          '503': errors['503'],
        },
      },
      post: {
        operationId: 'createProduct',
        security: secured,
        requestBody: {
          required: true,
          content: json({
            oneOf: [
              {
                type: 'object',
                required: ['product'],
                properties: {
                  product: productInputSchema,
                  image: { type: 'string', format: 'uri' },
                },
              },
              productInputSchema,
            ],
          }),
        },
        responses: {
          '201': response('Product created', envelope('product', productSchema)),
          '401': errors['401'],
          '403': errors['403'],
          '422': errors['422'],
          '503': errors['503'],
        },
      },
    },
    '/products/{id}': {
      get: {
        operationId: 'getProduct',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } }],
        responses: {
          '200': response('Product details', envelope('product', productSchema)),
          '404': errors['404'],
          '422': errors['422'],
          '503': errors['503'],
        },
      },
    },
    '/auth/register': {
      post: {
        operationId: 'register',
        requestBody: { required: true, content: json(registerRequestSchema) },
        responses: {
          '201': response('Registered user and token', {
            type: 'object',
            required: ['user', 'token'],
            properties: { user: { type: 'object' }, token: { type: 'string' } },
          }),
          '409': errors['409'],
          '422': errors['422'],
          '503': errors['503'],
        },
      },
    },
    '/auth/login': {
      post: {
        operationId: 'login',
        requestBody: { required: true, content: json(loginRequestSchema) },
        responses: {
          '200': response('Authenticated user and token', {
            type: 'object',
            required: ['user', 'token'],
            properties: { user: { type: 'object' }, token: { type: 'string' } },
          }),
          '401': errors['401'],
          '422': errors['422'],
          '503': errors['503'],
          '429': response('Too many authentication attempts', errorResponse),
        },
      },
    },
    '/auth/me': {
      get: {
        operationId: 'getCurrentUser',
        security: secured,
        responses: {
          '200': response('Current user', envelope('user', { type: 'object' })),
          '401': errors['401'],
          '503': errors['503'],
        },
      },
    },
    '/upload': {
      post: {
        operationId: 'uploadImage',
        security: secured,
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { type: 'object', required: ['image'], properties: { image: { type: 'string' } } } },
            'multipart/form-data': { schema: { type: 'object', required: ['image'], properties: { image: { type: 'string', format: 'binary' } } } },
          },
        },
        responses: {
          '200': response('Uploaded image URL', envelope('imageUrl', { type: 'string', format: 'uri' })),
          '401': errors['401'],
          '422': errors['422'],
          '503': errors['503'],
        },
      },
    },
    '/orders': {
      post: {
        operationId: 'createOrder',
        security: secured,
        requestBody: { required: true, content: json(orderRequestSchema) },
        responses: {
          '201': response('Payment order created', envelope('order', { type: 'object' })),
          '401': errors['401'],
          '404': errors['404'],
          '422': errors['422'],
          '503': errors['503'],
        },
      },
    },
    '/payments/verify': {
      post: {
        operationId: 'verifyPayment',
        security: secured,
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['orderId', 'paymentId', 'signature'],
            properties: {
              orderId: { type: 'string', maxLength: 128 },
              paymentId: { type: 'string', maxLength: 128 },
              signature: { type: 'string', maxLength: 256 },
            },
          }),
        },
        responses: {
          '200': response('Payment verification result', { type: 'object', required: ['verified', 'order'] }),
          '401': errors['401'],
          '403': errors['403'],
          '404': errors['404'],
          '422': errors['422'],
          '503': errors['503'],
        },
      },
    },
    '/services/requests': {
      post: {
        operationId: 'createServiceRequest',
        security: secured,
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['type', 'device', 'imei', 'details'],
            properties: {
              type: { type: 'string', enum: ['repair', 'trade-in'] },
              device: { type: 'string' },
              imei: { type: 'string', pattern: '^\\d{15}$' },
              details: { type: 'string' },
            },
          }),
        },
        responses: {
          '201': response('Service request created', envelope('serviceRequest', { type: 'object' })),
          '401': errors['401'],
          '422': errors['422'],
          '503': errors['503'],
        },
      },
    },
    '/admin/services': {
      get: {
        operationId: 'listServiceRequests',
        security: secured,
        responses: {
          '200': response('Service requests', {
            type: 'object',
            properties: { requests: { type: 'array', items: { type: 'object' } } },
          }),
          '401': errors['401'],
          '403': errors['403'],
          '503': errors['503'],
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: { ErrorResponse: errorResponse, Product: productSchema },
  },
};
