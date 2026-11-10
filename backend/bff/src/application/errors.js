// Erros da aplicação do BFF. A camada de API traduz cada tipo para HTTP.
class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

class ValidationError extends AppError {
  constructor(message) { super(message, 'VALIDATION_ERROR'); }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Autenticação necessária.') { super(message, 'UNAUTHORIZED'); }
}

class ForbiddenError extends AppError {
  constructor(message = 'Seu perfil não permite esta operação.') { super(message, 'FORBIDDEN'); }
}

class NotFoundError extends AppError {
  constructor(message) { super(message, 'NOT_FOUND'); }
}

// Falha de um serviço dependente. code: TIMEOUT, UNAVAILABLE, BAD_RESPONSE ou ALL_SOURCES_UNAVAILABLE.
class UpstreamError extends AppError {
  constructor(source, code, message, options = {}) {
    super(message, code);
    this.source = source;
    if (options.cause) this.cause = options.cause;
  }
}

module.exports = { AppError, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, UpstreamError };
