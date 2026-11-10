// Registra método, caminho (sem query string, que pode conter dados pessoais), status e duração.
function requestLogger(logger) {
  return (request, response, next) => {
    const path = request.originalUrl.split('?')[0];
    if (path.startsWith('/health')) return next();
    const startedAt = process.hrtime.bigint();
    response.on('finish', () => {
      logger.info('request', {
        method: request.method,
        path,
        status: response.statusCode,
        durationMs: Number((process.hrtime.bigint() - startedAt) / 1000000n),
        correlationId: request.correlationId
      });
    });
    return next();
  };
}

module.exports = { requestLogger };
