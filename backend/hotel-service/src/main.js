const express = require('express');
const cors = require('cors');
const http = require('node:http');

const config = require('./config');
const { Room } = require('./domain/room');
const { correlationMiddleware } = require('./api/middleware/correlation');
const { loggerMiddleware } = require('./api/middleware/logger');
const { internalAuthMiddleware } = require('./api/middleware/internal-auth');
const { errorHandler } = require('./api/middleware/error-handler');
const { createHealthRouter } = require('./api/routes/health');
const { createRoomsRouter } = require('./api/routes/rooms');

const { SetRoomCleaningStatusHandler } = require('./application/features/rooms/set-room-cleaning-status/handler');

function createApp({ handler } = {}) {
  const app = express();

  app.use(cors());

  // Tratamento customizado de JSON inválido no body-parser
  app.use(express.json({
    verify: (req, res, buf) => {
      try {
        if (buf.length > 0) JSON.parse(buf.toString());
      } catch (e) {
        const error = new Error('Payload JSON inválido.');
        error.statusCode = 400;
        throw error;
      }
    }
  }));

  app.use(correlationMiddleware);
  app.use(loggerMiddleware);
  app.use(internalAuthMiddleware);

  const rooms = new Map([['r1', new Room({ id: 'r1', status: 'cleaning' })]]);
  const activeHandler = handler || new SetRoomCleaningStatusHandler({
    roomRepository: { findById: async id => rooms.get(id), save: async room => rooms.set(room.id, room) },
    eventPublisher: { publish: async () => undefined }
  });

  app.use(createHealthRouter());
  app.use(createRoomsRouter({ setRoomCleaningStatusHandler: activeHandler }));

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

function createHotelServer(customHandler) {
  const app = createApp({ handler: customHandler });
  return http.createServer(app);
}

const app = createApp();
const server = http.createServer(app);

if (require.main === module) {
  server.listen(config.port, '0.0.0.0', () => {
    console.log(`[Hotel Service] Servidor Express rodando na porta ${config.port} (0.0.0.0)`);
  });
}

module.exports = {
  app,
  server,
  createApp,
  createHotelServer
};
