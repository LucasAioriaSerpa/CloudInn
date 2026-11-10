const crypto = require('node:crypto');

// Aceita só chamadas com o cabeçalho x-internal-api-key enviado pelo BFF.
// Saúde e documentação ficam abertas para probes e para a banca consultar o Swagger.
const PUBLIC_PATHS = ['/health', '/docs', '/openapi.json'];
const digest = value => crypto.createHash('sha256').update(String(value)).digest();

function internalAuth(expectedKey) {
  if (!expectedKey) return (request, response, next) => next();
  const expected = digest(expectedKey);
  return (request, response, next) => {
    if (PUBLIC_PATHS.some(path => request.path === path || request.path.startsWith(`${path}/`))) return next();
    const received = request.get('x-internal-api-key');
    if (received && crypto.timingSafeEqual(digest(received), expected)) return next();
    return response.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Chamada interna sem chave válida.', correlationId: request.correlationId }
    });
  };
}

module.exports = { internalAuth };
