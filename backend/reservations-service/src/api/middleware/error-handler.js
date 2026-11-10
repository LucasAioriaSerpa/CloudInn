function errorHandler(err, req, res, next) {
  const correlationId = req.correlationId || 'none';
  let statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);

  if (
    err.name === 'MissingIdempotencyKeyError' ||
    err.name === 'InvalidTotalAmountError' ||
    err.message?.includes('Checkout must be after check-in')
  ) {
    statusCode = 400;
  } else if (
    err.name === 'RoomUnavailableError' ||
    err.message?.includes('Quarto indisponível')
  ) {
    statusCode = 409;
  } else if (err.name === 'SyntaxError' || err.type === 'entity.parse.failed') {
    statusCode = 400;
  }

  const errorResponse = {
    error: {
      code: err.code || (statusCode === 409 ? 'ROOM_UNAVAILABLE' : statusCode === 400 ? 'VALIDATION_ERROR' : statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR'),
      message: err.message || 'Erro interno no Reservas Service.',
      correlationId
    }
  };

  res.status(statusCode).json(errorResponse);
}

module.exports = { errorHandler };
