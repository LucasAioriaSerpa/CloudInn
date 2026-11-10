const { ValidationError, ConflictError, NotFoundError, UnauthorizedError } = require('../../domain/errors');

const STATUS_BY_ERROR = new Map([
  [ValidationError, 400],
  [UnauthorizedError, 401],
  [NotFoundError, 404],
  [ConflictError, 409]
]);

const errorBody = (code, message, correlationId) => ({ error: { code, message, correlationId } });

function notFound(request, response) {
  response.status(404).json(errorBody('NOT_FOUND', 'Rota não encontrada.', request.correlationId));
}

// Traduz erros de domínio para HTTP. Erros inesperados viram 500 sem expor detalhes ao cliente.
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
      if (error instanceof ErrorType) {
        return response.status(status).json(errorBody(error.code, error.message, correlationId));
      }
    }

    logger.error('Erro inesperado', { error, correlationId });
    return response.status(500).json(errorBody('INTERNAL_ERROR', 'Erro interno ao processar a requisição.', correlationId));
  };
}

module.exports = { errorHandler, notFound };
