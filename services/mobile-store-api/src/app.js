import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { config as defaultConfig } from './config.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { createApiRouter } from './routes/api.js';
import { createServices } from './services/index.js';

export function createApp({
  config = defaultConfig,
  services = createServices({ config }),
  logger = pino({ level: process.env.LOG_LEVEL || 'info' }),
} = {}) {
  const app = express();
  const allowedOrigins = config.corsOrigins || [];

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: false,
    maxAge: 600,
  }));
  app.use(pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
          remoteAddress: req.remoteAddress,
        };
      },
    },
  }));
  app.use(express.json({ limit: '16mb', type: 'application/json' }));
  app.use(express.urlencoded({ extended: false, limit: '16mb' }));
  app.use('/api', createApiRouter({ services }));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
