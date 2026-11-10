const sql = require('mssql');

let pool;
let connecting;
let databaseConfig;
let onRetry = () => undefined;

// Erros transitórios do Azure SQL (ex.: 40613 = banco serverless retomando da pausa) e de rede.
const TRANSIENT_NUMBERS = new Set([40613, 40197, 40501, 49918, 49919, 49920, 4221, 10928, 10929]);
const TRANSIENT_CODES = new Set(['ESOCKET', 'ETIMEOUT', 'ECONNCLOSED', 'ECONNRESET']);

const errorNumber = error => error?.number ?? error?.originalError?.number ?? error?.originalError?.info?.number;
const isTransient = error => TRANSIENT_NUMBERS.has(errorNumber(error)) || TRANSIENT_CODES.has(error?.code);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Recebe a configuração validada em src/config.js (decisão D9).
function configureConnection(config, options = {}) {
  databaseConfig = config;
  if (options.onRetry) onRetry = options.onRetry;
}

function buildPoolConfig(config) {
  if (config.mode === 'connection-string') {
    return config.connectionString;
  }

  return {
    server: config.server,
    port: config.port,
    database: config.database,

    authentication: {
      type: 'azure-active-directory-default',
      options: {}
    },

    options: {
      encrypt: true,
      trustServerCertificate: false
    },

    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    },

    connectionTimeout: 30000,
    requestTimeout: 30000
  };
}

// Conecta com novas tentativas e espera crescente (2s, 4s, 8s, 16s) para erros transitórios.
async function getConnection({ attempts = 5, baseDelayMs = 2000 } = {}) {
  if (pool) return pool;
  if (connecting) return connecting;
  if (!databaseConfig) {
    throw new Error('Conexão SQL não configurada: chame configureConnection antes de usar o banco.');
  }

  connecting = (async () => {
    for (let attempt = 1; ; attempt += 1) {
      try {
        pool = await new sql.ConnectionPool(buildPoolConfig(databaseConfig)).connect();
        return pool;
      } catch (error) {
        if (attempt >= attempts || !isTransient(error)) throw error;
        const delayMs = baseDelayMs * 2 ** (attempt - 1);
        onRetry({ attempt, delayMs, error });
        await sleep(delayMs);
      }
    }
  })().finally(() => { connecting = null; });

  return connecting;
}

// Request dentro da transação, quando houver; senão, direto no pool.
async function createRequest(transaction) {
  return transaction ? new sql.Request(transaction) : (await getConnection()).request();
}

async function ping() {
  await (await getConnection()).request().query('SELECT 1 AS ok');
}

async function closeConnection() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

module.exports = {
  sql,
  configureConnection,
  getConnection,
  createRequest,
  ping,
  closeConnection,
  errorNumber,
  isTransient
};
