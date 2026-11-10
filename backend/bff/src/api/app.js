const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { correlationId } = require('./middleware/correlation-id');
const { requestLogger } = require('./middleware/request-logger');
const { cors } = require('./middleware/cors');
const { requireAuth } = require('./middleware/auth');
const { errorHandler, notFound } = require('./middleware/error-handler');
const { loadOpenApiSpec } = require('./openapi');
const { healthRouter } = require('./routes/health');
const { authRouter } = require('./routes/auth');
const { aggregatedDataRouter } = require('./routes/aggregated-data');
const { proxyRouter } = require('./routes/proxy');

function createApp({ handlers, tokenService, proxy, logger, corsOrigins = [], healthDetails = {}, dependencyChecks = {} }) {
  const openApiSpec = loadOpenApiSpec();
  const app = express();
  app.disable('x-powered-by');
  app.use(correlationId());
  app.use(cors(corsOrigins));
  app.use(requestLogger(logger));
  app.use(express.json({ limit: '100kb' }));

  // Rotas públicas.
  app.use('/health', healthRouter({ healthDetails, dependencyChecks }));
  app.get('/openapi.json', (request, response) => response.json(openApiSpec));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: 'CloudInn BFF' }));
  app.use('/auth', authRouter({ handlers, tokenService }));

  // Rotas que exigem login.
  const authenticated = requireAuth(tokenService);
  app.use('/aggregated-data', authenticated, aggregatedDataRouter({ handlers }));
  app.use(['/rooms', '/staff', '/hotels', '/reservations', '/guests'], authenticated);
  app.use(proxyRouter({ proxy }));

  app.use(notFound);
  app.use(errorHandler(logger));
  return app;
}

module.exports = { createApp };
