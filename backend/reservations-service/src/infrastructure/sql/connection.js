const sql = require('mssql');

let pool;

const config = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_DATABASE,

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

async function getConnection() {
  if (pool) {
    return pool;
  }

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