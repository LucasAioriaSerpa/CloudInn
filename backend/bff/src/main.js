const fs = require('node:fs');
const path = require('node:path');
const { loadConfig, ConfigError } = require('./config');
const { createLogger } = require('./infrastructure/logging/logger');
const { composeBff } = require('./compose');

const envFile = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

let config;
try {
  config = loadConfig();
} catch (error) {
  if (!(error instanceof ConfigError)) throw error;
  process.stderr.write(`${JSON.stringify({ level: 'error', service: 'bff', message: 'Configuração inválida; o serviço não será iniciado.', missing: error.missing, invalid: error.invalid })}\n`);
  process.exit(1);
}

const logger = createLogger({ service: config.service, level: config.logLevel, includeStack: config.nodeEnv !== 'production' });
const server = composeBff(config, { logger });

server.listen(config.port, '0.0.0.0', () => {
  logger.info('BFF iniciado', {
    port: config.port,
    hotelService: new URL(config.hotelServiceUrl).host,
    reservationsService: new URL(config.reservationsServiceUrl).host,
    analyticsFunction: new URL(config.analyticsFunctionUrl).host,
    corsOrigins: config.corsOrigins,
    timeoutMs: config.downstreamTimeoutMs
  });
});

function shutdown(signal) {
  logger.info('Encerrando o BFF', { signal });
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
