const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig, ConfigError } = require('../src/config');

test('Usa a connection string quando informada (D9)', () => {
  const config = loadConfig({ AZURE_SQL_CONNECTION_STRING: 'Server=tcp:x;Database=y;' });
  assert.equal(config.database.mode, 'connection-string');
});

test('Sem connection string, usa login Entra com servidor e banco', () => {
  const config = loadConfig({ DB_SERVER: 'servidor', DB_DATABASE: 'banco' });
  assert.deepEqual(config.database, { mode: 'entra', server: 'servidor', port: 1433, database: 'banco' });
});

test('Sem nenhuma configuração de banco, lista o que falta sem expor valores', () => {
  assert.throws(
    () => loadConfig({ DB_SERVER: 'servidor-secreto' }),
    error => error instanceof ConfigError
      && error.missing.length === 1
      && !error.message.includes('servidor-secreto')
  );
});
