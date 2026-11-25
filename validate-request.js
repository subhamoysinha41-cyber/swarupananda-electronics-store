import { AppError, ERROR_CODES } from '../errors/app-error.js';

export function validateRequest(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new AppError(
        422,
        ERROR_CODES.VALIDATION_ERROR,
        'Request validation failed',
        details,
      ));
    }
    req.validated = req.validated || {};
    req.validated[source] = result.data;
    return next();
  };
}
