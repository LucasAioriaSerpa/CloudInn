const { UnauthorizedError, ForbiddenError } = require('../../application/errors');

// Exige "Authorization: Bearer <token>" emitido por POST /auth/login.
function requireAuth(tokenService) {
  return (request, response, next) => {
    const [scheme, token] = (request.get('authorization') || '').split(' ');
    if (scheme !== 'Bearer' || !token) return next(new UnauthorizedError());
    try {
      request.user = tokenService.verify(token);
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

function requireRole(...roles) {
  return (request, response, next) => (roles.includes(request.user?.role) ? next() : next(new ForbiddenError()));
}

module.exports = { requireAuth, requireRole };
