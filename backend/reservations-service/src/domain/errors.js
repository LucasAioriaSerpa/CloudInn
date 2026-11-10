class DomainError extends Error {
  constructor(message, code) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
  }
}

class MissingIdempotencyKeyError extends DomainError {
  constructor(message = 'Idempotency-Key é obrigatória.') {
    super(message, 'MISSING_IDEMPOTENCY_KEY');
  }
}

class InvalidTotalAmountError extends DomainError {
  constructor(message = 'Valor total inválido.') {
    super(message, 'INVALID_TOTAL_AMOUNT');
  }
}

class RoomUnavailableError extends DomainError {
  constructor(message = 'Quarto indisponível') {
    super(message, 'ROOM_UNAVAILABLE');
  }
}

module.exports = {
  DomainError,
  MissingIdempotencyKeyError,
  InvalidTotalAmountError,
  RoomUnavailableError
};
