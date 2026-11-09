const { app } = require('@azure/functions');
const { validateCloudEvent, mask } = require('../lib/analytics');

// Assinatura sub-analytics-worker (recebe todos os eventos). Projeção analítica assíncrona.
// TODO (time de analytics): persistir a projeção (ex.: Table Storage / Cosmos); hoje só valida e registra.
app.serviceBusTopic('projectEvents', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: 'cloudinn.domain.events',
  subscriptionName: 'sub-analytics-worker',
  handler: async (message, context) => {
    const event = validateCloudEvent(typeof message === 'string' ? JSON.parse(message) : message);
    // Exceção => o Service Bus reentrega; após MaxDeliveryCount vai para a DLQ.
    context.log(mask(`evento ${event.type} id=${event.id} subject=${event.subject ?? '-'}`));
  }
});
