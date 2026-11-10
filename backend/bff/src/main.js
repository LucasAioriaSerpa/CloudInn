const express = require('express');
const cors = require('cors');
const http = require('node:http');

const config = require('./config');
const { correlationMiddleware } = require('./api/middleware/correlation');
const { loggerMiddleware } = require('./api/middleware/logger');
const { errorHandler } = require('./api/middleware/error-handler');
const { createHealthRouter } = require('./api/routes/health');
const { createAggregatedDataRouter } = require('./api/routes/aggregated-data');

const { GetAggregatedDataHandler } = require('./application/features/aggregated-data/handler');
const { AggregatedDataAssembler } = require('./application/features/aggregated-data/assembler');
const { GatewayClient } = require('./infrastructure/gateway-client');

function createApp({ handler } = {}) {
  const app = express();

  app.use(cors({
    origin: config.corsOrigins,
    credentials: true
  }));

  app.use(express.json());
  app.use(correlationMiddleware);
  app.use(loggerMiddleware);

  const defaultTransport = {
    get: async route => ({ route, items: [], guests: [] }),
    post: async route => ({ route, occupancyRate: 0, projectedRevenue: 0 })
  };

  const activeHandler = handler || new GetAggregatedDataHandler({
    gatewayClient: new GatewayClient({ transport: defaultTransport }),
    assembler: new AggregatedDataAssembler()
  });

  app.use(createHealthRouter());
  app.use(createAggregatedDataRouter({ handler: activeHandler }));

  // Fallback 404
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint não encontrado.',
        correlationId: req.correlationId || 'none'
      }
    });
  });

  // Middleware central de tratamento de erros
  app.use(errorHandler);

  return app;
}

function createBffServer(customHandler) {
  const app = createApp({ handler: customHandler });
  return http.createServer(app);
}

const app = createApp();
const server = http.createServer(app);

if (require.main === module) {
  server.listen(config.port, '0.0.0.0', () => {
    console.log(`[BFF] Servidor Express rodando na porta ${config.port} (0.0.0.0)`);
  });
}

module.exports = {
  app,
  server,
  createApp,
  createBffServer
};
