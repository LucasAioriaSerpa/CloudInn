const config = require('../../config');

function internalAuthMiddleware(req, res, next) {
  // Endpoints públicos de observabilidade e documentação
  const openPaths = ['/health', '/openapi.json', '/docs'];
  if (openPaths.includes(req.path) || req.path.startsWith('/docs')) {
    return next();
  }

  // Em ambiente de teste unitário local sem auth ativada, permite bypass
  if (process.env.NODE_ENV === 'test' && !req.headers['x-internal-api-key']) {
    return next();
  }

  const apiKey = req.headers['x-internal-api-key'];
  if (!apiKey || apiKey !== config.internalApiKey) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Acesso não autorizado: x-internal-api-key inválida ou ausente.',
        correlationId: req.correlationId || 'none'
      }
    });
  }

  next();
}

module.exports = { internalAuthMiddleware };
