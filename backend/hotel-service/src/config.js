// Leitura e validação das variáveis de ambiente. Nunca inclui valores nas mensagens de erro.
class ConfigError extends Error {
  constructor({ missing = [], invalid = [] }) {
    super(`Configuração inválida. Ausentes: ${missing.join(', ') || 'nenhuma'}. Inválidas: ${invalid.join(', ') || 'nenhuma'}.`);
    this.name = 'ConfigError';
    this.missing = missing;
    this.invalid = invalid;
  }
}

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'];

function readPort(value, fallback, name, invalid) {
  if (value === undefined || value === '') return fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    invalid.push(name);
    return fallback;
  }
  return port;
}

function readLogLevel(value, invalid) {
  const level = value || 'info';
  if (!LOG_LEVELS.includes(level)) invalid.push('LOG_LEVEL');
  return level;
}

// Eventos: "servicebus" publica e consome no Azure Service Bus; "log" apenas registra (desenvolvimento local)
// e é recusado com NODE_ENV=production. Tópico e assinatura conforme o plano de integração (seção 7).
const EVENT_PUBLISHERS = ['log', 'servicebus'];
const DEFAULT_TOPIC = 'cloudinn.domain.events';
const DEFAULT_SUBSCRIPTION = 'sub-hotel-service';

function readEvents(env, missing, invalid) {
  const publisher = env.EVENT_PUBLISHER || 'log';
  if (!EVENT_PUBLISHERS.includes(publisher)) invalid.push('EVENT_PUBLISHER');
  if (publisher === 'log' && env.NODE_ENV === 'production') invalid.push('EVENT_PUBLISHER');
  const connectionString = env.SERVICEBUS_CONNECTION?.trim();
  if (publisher === 'servicebus' && !connectionString) missing.push('SERVICEBUS_CONNECTION');
  return {
    publisher,
    serviceBus: {
      connectionString,
      topic: env.SERVICEBUS_TOPIC?.trim() || DEFAULT_TOPIC,
      subscription: env.SERVICEBUS_SUBSCRIPTION?.trim() || DEFAULT_SUBSCRIPTION
    }
  };
}

// Chave compartilhada com o BFF. Obrigatória em produção; sem ela, em desenvolvimento, as rotas ficam abertas.
function readInternalApiKey(env, missing) {
  const key = env.INTERNAL_API_KEY?.trim();
  if (!key && env.NODE_ENV === 'production') missing.push('INTERNAL_API_KEY');
  return key || null;
}

function loadConfig(env = process.env) {
  const missing = [];
  const invalid = [];
  for (const name of ['MONGODB_URI', 'MONGODB_DB_NAME']) {
    if (!env[name]) missing.push(name);
  }
  const events = readEvents(env, missing, invalid);
  const config = {
    service: 'hotel-service',
    nodeEnv: env.NODE_ENV || 'development',
    port: readPort(env.PORT, 5001, 'PORT', invalid),
    logLevel: readLogLevel(env.LOG_LEVEL, invalid),
    eventPublisher: events.publisher,
    serviceBus: events.serviceBus,
    mongo: { uri: env.MONGODB_URI, dbName: env.MONGODB_DB_NAME },
    internalApiKey: readInternalApiKey(env, missing)
  };
  if (missing.length || invalid.length) throw new ConfigError({ missing, invalid: [...new Set(invalid)] });
  return config;
}

module.exports = { loadConfig, ConfigError };
