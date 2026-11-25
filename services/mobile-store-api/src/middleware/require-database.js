import { AppError, ERROR_CODES } from '../errors/app-error.js';

export function requireDatabase(database) {
  return async (_req, _res, next) => {
    try {
      if (!(await database.healthCheck())) {
        throw new AppError(503, ERROR_CODES.SERVICE_UNAVAILABLE, 'Database is unavailable');
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
