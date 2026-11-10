let sql;
try {
  sql = require('mssql');
} catch {
  sql = null;
}

let pool;

const required = ['DB_SERVER', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD'];

function validateConfig() {
  const missing = required.filter(name => !process.env[name]);
  if (missing.length) {
    throw new Error(`Variáveis de ambiente ausentes: ${missing.join(', ')}`);
  }
}

const config = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  options: {
    encrypt: true,
    trustServerCertificate: false
  },

  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  connectionTimeout: 30000,
  requestTimeout: 30000
};

/** example of how to create a user and grant permissions in Azure SQL:
 * CREATE USER cloudinn_app WITH PASSWORD = '<senha-forte>';
 * GRANT EXECUTE ON dbo.CreateConfirmedReservation TO cloudinn_app;
 * GRANT SELECT, INSERT, UPDATE ON dbo.IdempotencyKeys TO cloudinn_app;
 */

async function getConnection() {
  if (pool) {
    return pool;
  }

  validateConfig();
  pool = await new sql.ConnectionPool(config).connect();

  console.log('Conectado ao Azure SQL com sucesso!');

  return pool;
}

async function closeConnection() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

module.exports = {
  sql,
  getConnection,
  closeConnection
};