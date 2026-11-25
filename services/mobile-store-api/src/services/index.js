import { models } from '../models/index.js';
import { AuthService } from './auth-service.js';
import { createBlobStorageProvider } from './blob-storage-provider.js';
import { DatabaseService } from './database-service.js';
import { CloudinaryMediaService } from './media-service.js';
import { RazorpayPaymentService } from './payment-service.js';
import { ProductService } from './product-service.js';
import { ServiceRequestService } from './service-request-service.js';

export function createServices({ config, modelSet = models, overrides = {} }) {
  return {
    database: new DatabaseService(),
    auth: new AuthService({ User: modelSet.User, config }),
    products: new ProductService({ Product: modelSet.Product }),
    media: new CloudinaryMediaService({ config }),
    payments: new RazorpayPaymentService({
      config,
      Order: modelSet.Order,
      Product: modelSet.Product,
    }),
    serviceRequests: new ServiceRequestService({
      ServiceRequest: modelSet.ServiceRequest,
      User: modelSet.User,
    }),
    blobStorage: createBlobStorageProvider(config),
    ...overrides,
  };
}
