require('dotenv').config({ quiet: true });

const { loadConfig, ConfigError } = require('./config');
const { createLogger } = require('./infrastructure/logging/logger');
const { configureConnection, getConnection, closeConnection, ping } = require('./infrastructure/sql/connection');
const { SqlUnitOfWork } = require('./infrastructure/sql/unit-of-work');
const { SqlReservationRepository } = require('./infrastructure/sql/reservation-repository');
const { SqlGuestRepository } = require('./infrastructure/sql/guest-repository');
const { SqlIdempotencyRepository } = require('./infrastructure/sql/idempotency-repository');
const { SqlAuditLog } = require('./infrastructure/sql/audit-log');
const { SqlOutbox, SqlOutboxStore } = require('./infrastructure/sql/outbox');
const { OutboxRelay } = require('./infrastructure/messaging/outbox-relay');
const { LogEventPublisher } = require('./infrastructure/messaging/log-event-publisher');
const { ServiceBusClient, ServiceBusEventPublisher, subscribe } = require('./infrastructure/messaging/service-bus');
const { createRoomReleaseListener } = require('./infrastructure/messaging/room-release-listener');
const { systemClock } = require('./infrastructure/system-clock');
const { createHandlers } = require('./application/create-handlers');
const { createHttpServer } = require('./api/http-server');

let config;
try {
  config = loadConfig();
} catch (error) {
  if (!(error instanceof ConfigError)) throw error;
  process.stderr.write(`${JSON.stringify({ level: 'error', service: 'reservations-service', message: 'Configuração inválida; o serviço não será iniciado.', missing: error.missing, invalid: error.invalid })}\n`);
  process.exit(1);
}

const logger = createLogger({ service: config.service, level: config.logLevel, includeStack: config.nodeEnv !== 'production' });
if (!config.internalApiKey) logger.warn('INTERNAL_API_KEY ausente: rotas abertas sem chave interna (aceito só fora de produção).');

configureConnection(config.database, {
  onRetry: ({ attempt, delayMs, error }) => logger.warn('Azure SQL indisponível; nova tentativa', { attempt, delayMs, error })
});

const unitOfWork = new SqlUnitOfWork();
const handlers = createHandlers({
  reservationRepository: new SqlReservationRepository(),
  guestRepository: new SqlGuestRepository(),
  idempotencyRepository: new SqlIdempotencyRepository(),
  auditLog: new SqlAuditLog(),
  outbox: new SqlOutbox(),
  unitOfWork,
  clock: systemClock
});

// Eventos: a Outbox é sempre gravada; o OutboxRelay publica no Service Bus (ou só registra em log, localmente).
const useServiceBus = config.eventPublisher === 'servicebus';
const busClient = useServiceBus ? new ServiceBusClient(config.serviceBus.connectionString) : null;
const busPublisher = useServiceBus ? new ServiceBusEventPublisher({ client: busClient, topic: config.serviceBus.topic }) : null;
const relay = new OutboxRelay({
  store: new SqlOutboxStore({ unitOfWork }),
  publisher: busPublisher ?? new LogEventPublisher({ logger }),
  logger
});
let closeSubscription = async () => undefined;

const server = createHttpServer({
  handlers,
  logger,
  healthDetails: { persistence: 'azure-sql', eventPublisher: config.eventPublisher },
  internalApiKey: config.internalApiKey,
  readinessCheck: ping
});

async function startServer() {
  try {
    await getConnection();
    logger.info('Conectado ao Azure SQL', { authMode: config.database.mode });

    relay.start();
    if (useServiceBus) {
      closeSubscription = subscribe({
        client: busClient,
        topic: config.serviceBus.topic,
        subscription: config.serviceBus.subscription,
        logger,
        onEvent: createRoomReleaseListener({ logger })
      });
      logger.info('Eventos via Service Bus', { topic: config.serviceBus.topic, subscription: config.serviceBus.subscription });
    } else {
      logger.warn('EVENT_PUBLISHER=log: eventos da Outbox só registrados em log e consumo desativado (apenas desenvolvimento local).');
    }

    server.listen(config.port, '0.0.0.0', () => {
      logger.info('Reservations Service iniciado', { port: config.port });
    });
  } catch (error) {
    logger.error('Não foi possível iniciar o serviço', { error });
    process.exit(1);
  }
}

function shutdown(signal) {
  logger.info('Encerrando o Reservations Service', { signal });

  server.close(async () => {
    await relay.stop();
    await closeSubscription().catch(() => undefined);
    await busPublisher?.close().catch(() => undefined);
    await busClient?.close().catch(() => undefined);
    await closeConnection();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
