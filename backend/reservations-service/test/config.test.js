const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig, ConfigError } = require('../src/config');

test('Usa a connection string quando informada (D9)', () => {
  const config = loadConfig({ AZURE_SQL_CONNECTION_STRING: 'Server=tcp:x;Database=y;' });
  assert.equal(config.database.mode, 'connection-string');
});

test('Sem connection string e sem credenciais SQL, usa login Entra com servidor e banco', () => {
  const config = loadConfig({ DB_SERVER: 'servidor', DB_DATABASE: 'banco' });
  assert.deepEqual(config.database, { mode: 'entra', server: 'servidor', port: 1433, database: 'banco' });
});

test('Sem connection string, usa login SQL com DB_USER e DB_PASSWORD', () => {
  const config = loadConfig({
    DB_SERVER: 'servidor',
    DB_DATABASE: 'banco',
    DB_USER: 'usuario',
    DB_PASSWORD: 'senha'
  });
  assert.deepEqual(config.database, {
    mode: 'sql-auth',
    server: 'servidor',
    port: 1433,
    database: 'banco',
    user: 'usuario',
    password: 'senha'
  });
});

test('Credenciais SQL incompletas são rejeitadas sem expor a senha', () => {
  assert.throws(
    () => loadConfig({
      DB_SERVER: 'servidor',
      DB_DATABASE: 'banco',
      DB_USER: 'usuario',
      DB_PASSWORD: ''
    }),
    error => error instanceof ConfigError
      && error.missing.includes('DB_PASSWORD')
      && !error.message.includes('senha')
  );
});

test('Sem nenhuma configuração de banco, lista o que falta sem expor valores', () => {
  assert.throws(
    () => loadConfig({ DB_SERVER: 'servidor-secreto' }),
    error => error instanceof ConfigError
      && error.missing.length === 1
      && !error.message.includes('servidor-secreto')
  );
});
