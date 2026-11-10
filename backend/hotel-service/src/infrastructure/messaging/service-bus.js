const { ServiceBusClient } = require('@azure/service-bus');
const { toServiceBusMessage, fromServiceBusMessage, InvalidEventError } = require('./cloud-events');

class ServiceBusEventPublisher {
  constructor({ client, topic }) {
    this.sender = client.createSender(topic);
  }

  async publish(event) {
    await this.sender.sendMessages(toServiceBusMessage(event));
  }

  async close() {
    await this.sender.close();
  }
}

// Assina o tópico. Liquidação manual de cada mensagem:
// - processada (ou ignorada pela regra de negócio): complete;
// - envelope inválido: dead-letter imediato (repetir não resolve);
// - erro inesperado: abandon, para o Service Bus reentregar e, após MaxDeliveryCount, mover para a DLQ.
function subscribe({ client, topic, subscription, onEvent, logger }) {
  const receiver = client.createReceiver(topic, subscription);
  const handle = receiver.subscribe({
    processMessage: async message => {
      try {
        await onEvent(fromServiceBusMessage(message));
        await receiver.completeMessage(message);
      } catch (error) {
        if (error instanceof InvalidEventError) {
          logger.warn('Evento inválido enviado para a dead-letter', { error, messageId: message.messageId, subscription });
          await receiver.deadLetterMessage(message, { deadLetterReason: 'InvalidCloudEvent', deadLetterErrorDescription: error.message });
          return;
        }
        logger.error('Falha ao processar evento; será reentregue', { error, messageId: message.messageId, subscription });
        await receiver.abandonMessage(message);
      }
    },
    processError: async ({ error, errorSource }) => {
      logger.error('Erro na assinatura do Service Bus', { error, errorSource, subscription });
    }
  }, { autoCompleteMessages: false });

  return async () => {
    await handle.close();
    await receiver.close();
  };
}

module.exports = { ServiceBusClient, ServiceBusEventPublisher, subscribe };
