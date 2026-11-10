// Publicador para desenvolvimento local (EVENT_PUBLISHER=log): registra o evento no log em vez de
// enviá-lo ao broker. Recusado com NODE_ENV=production.
class LogEventPublisher {
  constructor({ logger }) {
    this.logger = logger;
  }

  async publish(event) {
    this.logger.info('Evento registrado localmente (não enviado ao broker)', {
      eventType: event.type,
      eventId: event.id,
      subject: event.subject,
      correlationId: event.correlationid
    });
  }
}

module.exports = { LogEventPublisher };
