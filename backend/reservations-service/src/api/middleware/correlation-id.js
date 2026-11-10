const { randomUUID } = require('node:crypto');

// Aceita o x-correlation-id recebido quando ele tem formato seguro; caso contrário, gera um novo.
const VALID_ID = /^[A-Za-z0-9._-]{1,128}$/;

function correlationId() {
  return (request, response, next) => {
    const incoming = request.get('x-correlation-id');
    const id = incoming && VALID_ID.test(incoming) ? incoming : randomUUID();
    request.correlationId = id;
    response.setHeader('x-correlation-id', id);
    next();
  };
}

module.exports = { correlationId };
