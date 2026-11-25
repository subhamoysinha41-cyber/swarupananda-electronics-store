import multer from 'multer';
import { ZodError } from 'zod';
import { AppError, ERROR_CODES } from '../errors/app-error.js';

export function notFoundHandler(_req, _res, next) {
  next(new AppError(404, ERROR_CODES.NOT_FOUND, 'Route not found'));
}

export function errorHandler(error, req, res, _next) {
  let appError = error;
  if (error instanceof ZodError) {
    appError = new AppError(422, ERROR_CODES.VALIDATION_ERROR, 'Request validation failed', error.issues);
  } else if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Image must be 10 MB or smaller'
      : 'Invalid image upload';
    appError = new AppError(422, ERROR_CODES.VALIDATION_ERROR, message);
  } else if (error instanceof SyntaxError && 'body' in error) {
    appError = new AppError(400, ERROR_CODES.BAD_REQUEST, 'Request body must be valid JSON');
  } else if (error?.code === 11000) {
    appError = new AppError(409, ERROR_CODES.CONFLICT, 'A record with these details already exists');
  } else if (error?.name === 'ValidationError') {
    appError = new AppError(422, ERROR_CODES.VALIDATION_ERROR, 'Request validation failed');
  } else if (
    ['MongoNetworkError', 'MongoNetworkTimeoutError', 'MongoServerSelectionError', 'MongoNotConnectedError']
      .includes(error?.name)
    || ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'].includes(error?.code)
  ) {
    appError = new AppError(503, ERROR_CODES.SERVICE_UNAVAILABLE, 'Database is unavailable');
  } else if (!(error instanceof AppError)) {
    req.log?.error({ errorName: error?.name || 'Error' }, 'Unhandled API error');
    appError = new AppError(500, ERROR_CODES.INTERNAL_ERROR, 'An internal error occurred');
  }

  return res.status(appError.status).json({
    error: {
      code: appError.code,
      message: appError.message,
      details: appError.details ?? null,
    },
  });
}
