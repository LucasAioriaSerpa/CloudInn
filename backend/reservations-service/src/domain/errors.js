// Erros de domínio: descrevem o problema de negócio sem conhecer HTTP.
// A camada de API traduz cada tipo para o status adequado.
class DomainError extends Error {
  constructor(message, code) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

class ValidationError extends DomainError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR');
  }
}

class ConflictError extends DomainError {
  constructor(message) {
    super(message, 'CONFLICT');
  }
}

class NotFoundError extends DomainError {
  constructor(message) {
    super(message, 'NOT_FOUND');
  }
}

module.exports = { DomainError, ValidationError, ConflictError, NotFoundError };
