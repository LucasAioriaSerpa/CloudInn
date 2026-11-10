// Abertura de conexão compartilhada pelos scripts de banco (usa o mesmo src/config.js do serviço).
require('dotenv').config({ quiet: true });

const { loadConfig, ConfigError } = require('../src/config');
const { configureConnection, getConnection, closeConnection } = require('../src/infrastructure/sql/connection');

const maskSecrets = text => String(text)
  .replace(/(password|pwd)\s*=\s*[^;]+/gi, '$1=***')
  .replace(/([a-z][a-z0-9+.-]*:\/\/)[^\s:@/]+:[^\s@/]+@/gi, '$1***:***@');

async function withDatabase(run) {
  let config;
  try {
    config = loadConfig();
  } catch (error) {
    if (!(error instanceof ConfigError)) throw error;
    console.error(`Configuração incompleta. Ausentes: ${error.missing.join(', ') || 'nenhuma'}. Inválidas: ${error.invalid.join(', ') || 'nenhuma'}.`);
    process.exitCode = 1;
    return;
  }
  configureConnection(config.database);
  try {
    await run(await getConnection());
  } catch (error) {
    console.error(`Falha: ${error.name}: ${maskSecrets(error.message)}`);
    process.exitCode = 1;
  } finally {
    await closeConnection();
  }
}

module.exports = { withDatabase };
