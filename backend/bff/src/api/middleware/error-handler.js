function errorHandler(err, req, res, next) {
  const correlationId = req.correlationId || 'none';
  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);

  const errorResponse = {
    error: {
      code: err.code || (statusCode === 404 ? 'NOT_FOUND' : statusCode === 400 ? 'VALIDATION_ERROR' : statusCode === 503 ? 'SERVICE_UNAVAILABLE' : 'INTERNAL_ERROR'),
      message: err.message || 'Erro interno no servidor.',
      correlationId
    }
  };

  res.status(statusCode).json(errorResponse);
}

module.exports = { errorHandler };
