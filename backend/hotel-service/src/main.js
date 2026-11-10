const fs = require('node:fs');
const path = require('node:path');
const { loadConfig, ConfigError } = require('./config');
const { createLogger } = require('./infrastructure/logging/logger');
const { connectMongo } = require('./infrastructure/persistence/mongo/client');
const { ensureIndexes } = require('./infrastructure/persistence/mongo/indexes');
const { MongoRoomRepository } = require('./infrastructure/persistence/mongo/mongo-room-repository');
const { MongoStaffRepository } = require('./infrastructure/persistence/mongo/mongo-staff-repository');
const { MongoHotelRepository } = require('./infrastructure/persistence/mongo/mongo-hotel-repository');
const { BcryptPasswordHasher } = require('./infrastructure/security/bcrypt-password-hasher');
const { MongoEventInbox } = require('./infrastructure/persistence/mongo/mongo-event-inbox');
const { LogEventPublisher } = require('./infrastructure/messaging/log-event-publisher');
const { SafeEventPublisher } = require('./infrastructure/messaging/safe-event-publisher');
const { ServiceBusClient, ServiceBusEventPublisher, subscribe } = require('./infrastructure/messaging/service-bus');
const systemClock = { now: () => new Date() };
const { createHandlers } = require('./application/create-handlers');
const { createHttpServer } = require('./api/http-server');

const envFile = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

let config;
try {
  config = loadConfig();
} catch (error) {
  if (!(error instanceof ConfigError)) throw error;
  process.stderr.write(`${JSON.stringify({ level: 'error', service: 'hotel-service', message: 'Configuração inválida; o serviço não será iniciado.', missing: error.missing, invalid: error.invalid })}\n`);
  process.exit(1);
}

const logger = createLogger({ service: config.service, level: config.logLevel, includeStack: config.nodeEnv !== 'production' });
if (!config.internalApiKey) logger.warn('INTERNAL_API_KEY ausente: rotas abertas sem chave interna (aceito só fora de produção).');

async function start() {
  let mongo;
  try {
    mongo = await connectMongo(config.mongo);
    await ensureIndexes(mongo.db);
    logger.info('Conectado ao MongoDB', { dbName: config.mongo.dbName });
  } catch (error) {
    logger.error('Não foi possível conectar ao MongoDB', { error });
    process.exit(1);
  }

  // Eventos: Service Bus em produção; em desenvolvimento local, apenas log e sem consumo.
  const useServiceBus = config.eventPublisher === 'servicebus';
  const busClient = useServiceBus ? new ServiceBusClient(config.serviceBus.connectionString) : null;
  const busPublisher = useServiceBus ? new ServiceBusEventPublisher({ client: busClient, topic: config.serviceBus.topic }) : null;

  const handlers = createHandlers({
    roomRepository: new MongoRoomRepository(mongo.db),
    staffRepository: new MongoStaffRepository(mongo.db),
    hotelRepository: new MongoHotelRepository(mongo.db),
    passwordHasher: new BcryptPasswordHasher(),
    eventInbox: new MongoEventInbox(mongo.db),
    clock: systemClock,
    eventPublisher: new SafeEventPublisher({ publisher: busPublisher ?? new LogEventPublisher({ logger }), logger })
  });

  let closeSubscription = async () => undefined;
  if (useServiceBus) {
    closeSubscription = subscribe({
      client: busClient,
      topic: config.serviceBus.topic,
      subscription: config.serviceBus.subscription,
      logger,
      onEvent: async event => {
        const result = await handlers.applyReservationEvent.execute(event);
        logger.info('Evento de reserva processado', {
          eventType: event.type, eventId: event.id, correlationId: event.correlationid, ...result
        });
      }
    });
    logger.info('Assinatura de eventos ativa', { topic: config.serviceBus.topic, subscription: config.serviceBus.subscription });
  } else {
    logger.warn('EVENT_PUBLISHER=log: eventos só registrados em log e consumo desativado (apenas desenvolvimento local).');
  }

  const server = createHttpServer({
    handlers,
    logger,
    healthDetails: { persistence: 'mongodb', eventPublisher: config.eventPublisher },
    internalApiKey: config.internalApiKey,
    readinessCheck: mongo.ping
  });

  server.listen(config.port, '0.0.0.0', () => {
    logger.info('Hotel Service iniciado', { port: config.port, persistence: 'mongodb', eventPublisher: config.eventPublisher });
  });

  const shutdown = signal => {
    logger.info('Encerrando o Hotel Service', { signal });
    server.close(async () => {
      await closeSubscription().catch(() => undefined);
      await busPublisher?.close().catch(() => undefined);
      await busClient?.close().catch(() => undefined);
      await mongo.client.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start();
