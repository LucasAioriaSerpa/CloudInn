const test = require('node:test');
const assert = require('node:assert/strict');
const { buildTestServer, withServer } = require('./support/fakes');
const { loadConfig, ConfigError } = require('../src/config');

test('Chave interna: rotas de negócio exigem x-internal-api-key; saúde e docs ficam abertas', async () => {
  const { server } = buildTestServer({ internalApiKey: 'chave-interna-de-teste' });
  await withServer(server, async baseUrl => {
    assert.equal((await fetch(`${baseUrl}/reservations`)).status, 401);
    assert.equal((await fetch(`${baseUrl}/guests`, { headers: { 'x-internal-api-key': 'errada' } })).status, 401);
    assert.equal((await fetch(`${baseUrl}/guests`, { headers: { 'x-internal-api-key': 'chave-interna-de-teste' } })).status, 200);
    assert.equal((await fetch(`${baseUrl}/health`)).status, 200);
    assert.equal((await fetch(`${baseUrl}/openapi.json`)).status, 200);
  });
});

test('Chave interna é obrigatória em produção', () => {
  const base = { AZURE_SQL_CONNECTION_STRING: 'Server=tcp:x;Database=y;' };
  assert.equal(loadConfig(base).internalApiKey, null);
  assert.throws(() => loadConfig({ ...base, NODE_ENV: 'production' }), error => error instanceof ConfigError && error.missing.includes('INTERNAL_API_KEY'));
});
