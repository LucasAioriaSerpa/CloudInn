try {
  require('dotenv').config();
} catch {
  if (typeof process.loadEnvFile === 'function') {
    try { process.loadEnvFile(); } catch {}
  }
}

const REQUIRED_IN_PROD = [
  'MONGODB_URI',
  'MONGODB_DB_NAME',
  'INTERNAL_API_KEY',
  'SERVICEBUS_CONNECTION',
  'EVENT_PUBLISHER'
];

function validateConfig() {
  if (process.env.NODE_ENV === 'production') {
    const missing = REQUIRED_IN_PROD.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`[Hotel Config] Variáveis obrigatórias ausentes em produção: ${missing.join(', ')}`);
    }

    if (process.env.EVENT_PUBLISHER === 'log') {
      throw new Error('[Hotel Config] EVENT_PUBLISHER=log é proibido em NODE_ENV=production. Use EVENT_PUBLISHER=servicebus.');
    }
  }
}

validateConfig();

module.exports = {
  port: Number(process.env.PORT || 5001),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  dbName: process.env.MONGODB_DB_NAME || 'cloudinn_hotel',
  internalApiKey: process.env.INTERNAL_API_KEY || 'dev-internal-key',
  serviceBusConnection: process.env.SERVICEBUS_CONNECTION || '',
  eventPublisher: process.env.EVENT_PUBLISHER || 'log',
  seedStaffPassword: process.env.SEED_STAFF_PASSWORD || '',
  validateConfig
};
