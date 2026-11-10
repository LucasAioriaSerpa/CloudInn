const { app } = require('@azure/functions');
const { validateCloudEvent, mask, describeEvent } = require('../lib/analytics');

// Assinatura sub-analytics-worker do tópico cloudinn.domain.events (recebe todos os eventos).
// Projeção analítica registrada em log estruturado (Application Insights): uma linha por evento,
// com tipo, id, assunto e correlationId. Não há persistência própria: os indicadores do painel são
// calculados sob demanda pelo HTTP Trigger (httpTriggerAnalytics) a partir dos dados atuais.
app.serviceBusTopic('projectEvents', {
  connection: 'SERVICEBUS_CONNECTION',
  topicName: 'cloudinn.domain.events',
  subscriptionName: 'sub-analytics-worker',
  handler: async (message, context) => {
    const event = validateCloudEvent(typeof message === 'string' ? JSON.parse(message) : message);
    // Exceção => o Service Bus reentrega; após MaxDeliveryCount vai para a DLQ.
    context.log(mask(describeEvent(event)));
  }
});
