try {
  require('dotenv').config();
} catch {
  if (typeof process.loadEnvFile === 'function') {
    try { process.loadEnvFile(); } catch {}
  }
}

const REQUIRED_IN_PROD = [
  'HOTEL_SERVICE_URL',
  'RESERVATIONS_SERVICE_URL',
  'INTERNAL_API_KEY',
  'JWT_SECRET'
];

function validateConfig() {
  if (process.env.NODE_ENV === 'production') {
    const missing = REQUIRED_IN_PROD.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`[BFF Config] Variáveis obrigatórias ausentes em produção: ${missing.join(', ')}`);
    }
  }
}

validateConfig();

module.exports = {
  port: Number(process.env.PORT || 4000),
  hotelServiceUrl: process.env.HOTEL_SERVICE_URL || 'http://localhost:5001',
  reservationsServiceUrl: process.env.RESERVATIONS_SERVICE_URL || 'http://localhost:5002',
  analyticsFunctionUrl: process.env.ANALYTICS_FUNCTION_URL || '',
  analyticsFunctionKey: process.env.ANALYTICS_FUNCTION_KEY || '',
  internalApiKey: process.env.INTERNAL_API_KEY || 'dev-internal-key',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-key-at-least-32-chars',
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) : '*',
  downstreamTimeoutMs: Number(process.env.DOWNSTREAM_TIMEOUT_MS || 5000),
  validateConfig
};
