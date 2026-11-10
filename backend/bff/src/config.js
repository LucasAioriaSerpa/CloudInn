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
const SECRET_QUERY_KEYS = /^(code|key|token|sig|api[_-]?key)$/i;
const MIN_JWT_SECRET_LENGTH = 32;

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

function readRequired(env, name, missing) {
  const value = env[name]?.trim();
  if (!value) missing.push(name);
  return value;
}

// URL http(s) sem credenciais embutidas: chaves vão em variáveis próprias.
function readServiceUrl(env, name, missing, invalid) {
  const value = readRequired(env, name, missing);
  if (!value) return undefined;
  try {
    const url = new URL(value);
    const hasSecret = url.username || url.password || [...url.searchParams.keys()].some(key => SECRET_QUERY_KEYS.test(key));
    if (!['http:', 'https:'].includes(url.protocol) || hasSecret) invalid.push(name);
    return url.toString().replace(/\/+$/, '');
  } catch {
    invalid.push(name);
    return undefined;
  }
}

function readTimeout(value, invalid) {
  if (value === undefined || value === '') return 10000;
  const ms = Number(value);
  if (!Number.isInteger(ms) || ms < 100 || ms > 60000) {
    invalid.push('DOWNSTREAM_TIMEOUT_MS');
    return 10000;
  }
  return ms;
}

// Lista de origens separadas por vírgula. Obrigatória em produção.
function readCorsOrigins(env, nodeEnv, missing, invalid) {
  const origins = (env.CORS_ORIGINS || '').split(',').map(origin => origin.trim().replace(/\/+$/, '')).filter(Boolean);
  if (!origins.length && nodeEnv === 'production') missing.push('CORS_ORIGINS');
  for (const origin of origins) {
    try {
      const url = new URL(origin);
      if (url.origin !== origin) invalid.push('CORS_ORIGINS');
    } catch {
      invalid.push('CORS_ORIGINS');
    }
  }
  return [...new Set(origins)];
}

function loadConfig(env = process.env) {
  const missing = [];
  const invalid = [];
  const nodeEnv = env.NODE_ENV || 'development';

  const jwtSecret = readRequired(env, 'JWT_SECRET', missing);
  if (jwtSecret && jwtSecret.length < MIN_JWT_SECRET_LENGTH) invalid.push('JWT_SECRET');

  const config = {
    service: 'bff',
    nodeEnv,
    port: readPort(env.PORT, 4000, 'PORT', invalid),
    logLevel: readLogLevel(env.LOG_LEVEL, invalid),
    hotelServiceUrl: readServiceUrl(env, 'HOTEL_SERVICE_URL', missing, invalid),
    reservationsServiceUrl: readServiceUrl(env, 'RESERVATIONS_SERVICE_URL', missing, invalid),
    analyticsFunctionUrl: readServiceUrl(env, 'ANALYTICS_FUNCTION_URL', missing, invalid),
    analyticsFunctionKey: readRequired(env, 'ANALYTICS_FUNCTION_KEY', missing),
    internalApiKey: readRequired(env, 'INTERNAL_API_KEY', missing),
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN?.trim() || '8h',
    corsOrigins: readCorsOrigins(env, nodeEnv, missing, invalid),
    downstreamTimeoutMs: readTimeout(env.DOWNSTREAM_TIMEOUT_MS, invalid)
  };

  if (missing.length || invalid.length) throw new ConfigError({ missing, invalid: [...new Set(invalid)] });
  return config;
}

module.exports = { loadConfig, ConfigError };
