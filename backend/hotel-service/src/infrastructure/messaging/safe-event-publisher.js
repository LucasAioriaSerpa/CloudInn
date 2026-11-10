// O MongoDB do Hotel não tem Outbox: o evento é publicado depois de gravar o quarto.
// Se o broker falhar, a operação do usuário já foi concluída; o evento perdido fica registrado
// no log (com tipo, id e correlationId) em vez de devolver erro sobre algo que já foi salvo.
class SafeEventPublisher {
  constructor({ publisher, logger }) {
    this.publisher = publisher;
    this.logger = logger;
  }

  async publish(event) {
    try {
      await this.publisher.publish(event);
    } catch (error) {
      this.logger.error('Evento NÃO publicado no Service Bus', {
        error, eventType: event.type, eventId: event.id, subject: event.subject, correlationId: event.correlationid
      });
    }
  }
}

module.exports = { SafeEventPublisher };
