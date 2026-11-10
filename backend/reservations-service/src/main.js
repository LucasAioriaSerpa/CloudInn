const express = require('express');
const cors = require('cors');
const http = require('node:http');

const config = require('./config');
const { correlationMiddleware } = require('./api/middleware/correlation');
const { loggerMiddleware } = require('./api/middleware/logger');
const { internalAuthMiddleware } = require('./api/middleware/internal-auth');
const { errorHandler } = require('./api/middleware/error-handler');
const { createHealthRouter } = require('./api/routes/health');
const { createReservationsRouter, safeStringify } = require('./api/routes/reservations');

const { getConnection, closeConnection } = require('./infrastructure/sql/connection');
const { SqlUnitOfWork } = require('./infrastructure/sql/unit-of-work');
const { SqlReservationRepository } = require('./infrastructure/sql/reservation-repository');
const { SqlIdempotencyRepository } = require('./infrastructure/sql/idempotency-repository');
const { CreateReservationHandler } = require('./application/features/reservations/create-reservation/handler');

function createApp({ handler } = {}) {
  const app = express();

  app.use(cors());

  app.use(express.json({
    verify: (req, res, buf) => {
      try {
        if (buf.length > 0) JSON.parse(buf.toString());
      } catch {
        const error = new Error('Payload JSON inválido.');
        error.statusCode = 400;
        throw error;
      }
    }
  }));

  app.use(correlationMiddleware);
  app.use(loggerMiddleware);
  app.use(internalAuthMiddleware);

  const defaultHandler = handler || new CreateReservationHandler({
    reservationRepository: new SqlReservationRepository(),
    idempotencyRepository: new SqlIdempotencyRepository(),
    unitOfWork: new SqlUnitOfWork()
  });

  app.use(createHealthRouter());
  app.use(createReservationsRouter({ createReservationHandler: defaultHandler }));

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

  app.use(errorHandler);

  return app;
}

function createServer(customHandler) {
  const app = createApp({ handler: customHandler });
  return http.createServer(app);
}

const app = createApp();
const server = http.createServer(app);

async function startServer() {
  try {
    await getConnection();

    server.listen(config.port, '0.0.0.0', () => {
      console.log(`[Reservas Service] Servidor Express rodando na porta ${config.port} (0.0.0.0)`);
    });
  } catch (error) {
    console.error('Não foi possível iniciar o serviço:', error);
    process.exit(1);
  }
}

async function shutdown() {
  console.log('Encerrando Reservations Service...');
  server.close(async () => {
    await closeConnection();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  server,
  createApp,
  createServer,
  safeStringify
};