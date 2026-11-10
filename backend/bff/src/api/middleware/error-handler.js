const { ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, UpstreamError } = require('../../application/errors');

const errorBody = (code, message, correlationId) => ({ error: { code, message, correlationId } });

function notFound(request, response) {
  response.status(404).json(errorBody('NOT_FOUND', 'Rota não encontrada.', request.correlationId));
}

const STATUS_BY_ERROR = new Map([
  [ValidationError, 400],
  [UnauthorizedError, 401],
  [ForbiddenError, 403],
  [NotFoundError, 404]
]);

// Falha de dependência: 502 para resposta inválida; 503 para indisponível, timeout ou todas as fontes fora.
const upstreamStatus = error => (error.code === 'BAD_RESPONSE' ? 502 : 503);

function errorHandler(logger) {
  return (error, request, response, next) => {
    if (response.headersSent) return next(error);
    const { correlationId } = request;

    if (error.type === 'entity.parse.failed') {
      return response.status(400).json(errorBody('VALIDATION_ERROR', 'O corpo da requisição deve ser um JSON válido.', correlationId));
    }
    if (error.type && error.status >= 400 && error.status < 500) {
      return response.status(error.status).json(errorBody('BAD_REQUEST', 'Requisição inválida.', correlationId));
    }
    for (const [ErrorType, status] of STATUS_BY_ERROR) {
      if (error instanceof ErrorType) return response.status(status).json(errorBody(error.code, error.message, correlationId));
    }
    if (error instanceof UpstreamError) {
      logger.warn('Serviço dependente falhou', { source: error.source, code: error.code, correlationId });
      return response.status(upstreamStatus(error)).json(errorBody(error.code, error.message, correlationId));
    }

    logger.error('Erro inesperado no BFF', { error, correlationId });
    return response.status(500).json(errorBody('INTERNAL_ERROR', 'Erro interno ao processar a requisição.', correlationId));
  };
}

module.exports = { errorHandler, notFound };
