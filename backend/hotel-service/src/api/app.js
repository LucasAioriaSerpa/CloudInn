const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { correlationId } = require('./middleware/correlation-id');
const { requestLogger } = require('./middleware/request-logger');
const { errorHandler, notFound } = require('./middleware/error-handler');
const { internalAuth } = require('./middleware/internal-auth');
const { loadOpenApiSpec } = require('./openapi');
const { roomsRouter } = require('./routes/rooms');
const { staffRouter } = require('./routes/staff');
const { hotelsRouter } = require('./routes/hotels');

function createApp({ handlers, logger, healthDetails = {}, readinessCheck = async () => undefined, internalApiKey = null }) {
  const openApiSpec = loadOpenApiSpec();
  const app = express();
  app.disable('x-powered-by');
  app.use(correlationId());
  app.use(requestLogger(logger));
  app.use(internalAuth(internalApiKey));
  app.use(express.json({ limit: '100kb' }));

  // Liveness: o processo está de pé.
  app.get('/health', (request, response) => {
    response.json({ status: 'ok', service: 'hotel-service', ...healthDetails });
  });
  // Readiness: o banco responde.
  app.get('/health/ready', async (request, response) => {
    try {
      await readinessCheck();
      response.json({ status: 'ready', service: 'hotel-service' });
    } catch (error) {
      logger.warn('Readiness falhou', { error, correlationId: request.correlationId });
      response.status(503).json({ status: 'unavailable', service: 'hotel-service' });
    }
  });

  app.get('/openapi.json', (request, response) => response.json(openApiSpec));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: 'CloudInn Hotel Service' }));

  app.use('/rooms', roomsRouter(handlers));
  app.use('/staff', staffRouter(handlers));
  app.use('/hotels', hotelsRouter(handlers));

  app.use(notFound);
  app.use(errorHandler(logger));
  return app;
}

module.exports = { createApp };
