import mongoose from 'mongoose';
import { AppError, ERROR_CODES } from '../errors/app-error.js';

export class DatabaseService {
  constructor({ connection = mongoose.connection } = {}) {
    this.connection = connection;
  }

  async healthCheck() {
    return this.connection.readyState === 1;
  }

  async requireConnection() {
    if (!(await this.healthCheck())) {
      throw new AppError(503, ERROR_CODES.SERVICE_UNAVAILABLE, 'Database is unavailable');
    }
  }
}
