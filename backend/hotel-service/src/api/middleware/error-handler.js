function errorHandler(err, req, res, next) {
  const correlationId = req.correlationId || 'none';
  let statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);

  if (err.message === 'Room not found') {
    statusCode = 404;
  } else if (err.message?.includes('Invalid room transition')) {
    statusCode = 409;
  } else if (err.name === 'SyntaxError' || err.type === 'entity.parse.failed') {
    statusCode = 400;
  }

  const errorResponse = {
    error: {
      code: err.code || (statusCode === 404 ? 'ROOM_NOT_FOUND' : statusCode === 409 ? 'INVALID_ROOM_TRANSITION' : statusCode === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR'),
      message: err.message || 'Erro interno no Hotel Service.',
      correlationId
    }
  };

  res.status(statusCode).json(errorResponse);
}

module.exports = { errorHandler };
