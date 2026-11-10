const crypto = require('node:crypto');

function correlationMiddleware(req, res, next) {
  const incoming = req.headers['x-correlation-id'];
  const correlationId = (typeof incoming === 'string' && incoming.trim() !== '')
    ? incoming.trim()
    : crypto.randomUUID();

  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
}

module.exports = { correlationMiddleware };
