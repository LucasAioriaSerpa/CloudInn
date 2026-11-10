// Conversão entre CloudEvents 1.0 e mensagens do Azure Service Bus.
const REQUIRED_FIELDS = ['specversion', 'id', 'source', 'type', 'time'];

class InvalidEventError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidEventError';
  }
}

function assertCloudEvent(event) {
  if (!event || typeof event !== 'object') throw new InvalidEventError('mensagem sem corpo JSON');
  const missing = REQUIRED_FIELDS.filter(field => !event[field]);
  if (missing.length) throw new InvalidEventError(`campos ausentes: ${missing.join(', ')}`);
  if (event.specversion !== '1.0') throw new InvalidEventError('specversion deve ser 1.0');
  return event;
}

function toServiceBusMessage(event) {
  assertCloudEvent(event);
  return {
    body: event,
    contentType: 'application/cloudevents+json',
    messageId: event.id, // permite a deduplicação do Service Bus, se habilitada no tópico
    correlationId: event.correlationid,
    subject: event.type,
    applicationProperties: { type: event.type, source: event.source }
  };
}

function fromServiceBusMessage(message) {
  let body = message.body;
  if (Buffer.isBuffer(body)) body = body.toString('utf8');
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      throw new InvalidEventError('corpo não é JSON');
    }
  }
  return assertCloudEvent(body);
}

module.exports = { toServiceBusMessage, fromServiceBusMessage, assertCloudEvent, InvalidEventError };
