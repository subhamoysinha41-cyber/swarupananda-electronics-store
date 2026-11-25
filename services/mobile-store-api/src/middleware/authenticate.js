import { AppError, ERROR_CODES } from '../errors/app-error.js';

export function createAuthenticationMiddleware(authService) {
  async function authenticate(req, _res, next) {
    try {
      const authorization = req.get('authorization') || '';
      const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
      if (!match) {
        throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Authentication required');
      }
      req.user = await authService.authenticate(match[1]);
      next();
    } catch (error) {
      next(error);
    }
  }

  function requireAdmin(req, _res, next) {
    if (req.user?.role !== 'admin') {
      return next(new AppError(403, ERROR_CODES.FORBIDDEN, 'Administrator access is required'));
    }
    return next();
  }

  return { authenticate, requireAdmin };
}
