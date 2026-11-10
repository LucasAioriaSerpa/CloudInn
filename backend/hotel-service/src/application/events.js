const crypto = require('node:crypto');

// Envelope CloudEvents 1.0. "correlationid" é um atributo de extensão (só minúsculas, pela especificação).
function createEvent({ type, source, subject, data, correlationId, now = new Date() }) {
  return {
    specversion: '1.0',
    id: crypto.randomUUID(),
    source,
    type,
    time: now.toISOString(),
    subject,
    datacontenttype: 'application/json',
    ...(correlationId ? { correlationid: correlationId } : {}),
    data
  };
}

module.exports = { createEvent };
