// CORS por lista de origens (CORS_ORIGINS). Origem fora da lista não recebe cabeçalhos CORS,
// então o navegador bloqueia a resposta.
const ALLOWED_HEADERS = 'Authorization, Content-Type, Idempotency-Key, X-Correlation-Id, X-Api-Key';
const ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';

function cors(allowedOrigins) {
  const allowed = new Set(allowedOrigins);
  return (request, response, next) => {
    const origin = request.get('origin');
    if (origin && allowed.has(origin)) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Access-Control-Expose-Headers', 'X-Correlation-Id');
      response.setHeader('Access-Control-Max-Age', '600');
    }
    response.append('Vary', 'Origin');
    if (request.method === 'OPTIONS') {
      if (origin && allowed.has(origin)) {
        response.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
        response.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
      }
      return response.status(204).end();
    }
    return next();
  };
}

module.exports = { cors };
