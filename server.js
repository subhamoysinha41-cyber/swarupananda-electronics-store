import mongoose from 'mongoose';
import pino from 'pino';
import { pathToFileURL } from 'node:url';
import { config } from './config.js';
import { createApp } from './app.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export async function startServer() {
  if (
    config.environment !== 'development'
    && Buffer.byteLength(config.jwtSecret || '', 'utf8') < 32
  ) {
    logger.error('A JWT_SECRET of at least 32 bytes is required outside development; authentication endpoints will be unavailable');
  }

  if (config.databaseUrl) {
    try {
      await mongoose.connect(config.databaseUrl, { serverSelectionTimeoutMS: 3000 });
      logger.info('MongoDB connected');
    } catch (error) {
      logger.error({ errorName: error?.name || 'Error' }, 'MongoDB unavailable; starting API in degraded mode');
    }
  } else {
    logger.warn('DATABASE_URL is not configured; starting API with database-dependent routes unavailable');
  }

  const app = createApp({ config, logger });
  const server = app.listen(config.port, () => {
    logger.info({ port: config.port }, 'Mobile Store API listening');
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer().catch((error) => {
    logger.error({ err: error }, 'API startup failed');
    process.exitCode = 1;
  });
}
