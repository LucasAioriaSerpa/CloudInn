const test = require('node:test');
const assert = require('node:assert/strict');
const { createHttpServer } = require('../src/api/http-server');
const { createHandlers } = require('../src/application/create-handlers');
const { loadConfig, ConfigError } = require('../src/config');
const { assertPort } = require('../src/application/ports');
const { createLogger } = require('../src/infrastructure/logging/logger');
const { buildTestServer, withServer, silentLogger } = require('./support/fakes');

test('Propaga um x-correlation-id válido recebido', async () => {
  await withServer(buildTestServer().server, async baseUrl => {
    const response = await fetch(`${baseUrl}/nao-existe`, { headers: { 'x-correlation-id': 'abc-123' } });
    assert.equal(response.headers.get('x-correlation-id'), 'abc-123');
    assert.equal((await response.json()).error.correlationId, 'abc-123');
  });
});

test('Gera um novo x-correlation-id quando o recebido é inseguro', async () => {
  await withServer(buildTestServer().server, async baseUrl => {
    const response = await fetch(`${baseUrl}/health`, { headers: { 'x-correlation-id': '<script>' } });
    const id = response.headers.get('x-correlation-id');
    assert.notEqual(id, '<script>');
    assert.match(id, /^[0-9a-f-]{36}$/);
  });
});

test('/health informa o modo de persistência', async () => {
  await withServer(buildTestServer().server, async baseUrl => {
    const body = await (await fetch(`${baseUrl}/health`)).json();
    assert.deepEqual(body, { status: 'ok', service: 'hotel-service', persistence: 'mongodb' });
  });
});

test('Log de requisição registra o caminho completo, sem query string', async () => {
  const entries = [];
  const logger = { ...silentLogger, info: (message, fields) => entries.push({ message, ...fields }) };
  const { ports } = buildTestServer();
  const server = createHttpServer({ handlers: createHandlers(ports), logger });
  await withServer(server, async baseUrl => {
    await fetch(`${baseUrl}/rooms/inexistente?cpf=12345678909`);
  });
  const entry = entries.find(item => item.message === 'request');
  assert.equal(entry.path, '/rooms/inexistente');
  assert.equal(entry.status, 404);
});

test('Configuração exige MongoDB e rejeita valores inválidos sem expor valores', () => {
  assert.equal(loadConfig({ MONGODB_URI: 'mongodb://servidor/banco', MONGODB_DB_NAME: 'cloudinn' }).port, 5001);
  assert.throws(
    () => loadConfig({}),
    error => error instanceof ConfigError && error.missing.includes('MONGODB_URI') && error.missing.includes('MONGODB_DB_NAME')
  );
  assert.throws(
    () => loadConfig({ MONGODB_URI: 'mongodb://segredo', MONGODB_DB_NAME: 'x', PORT: 'abc', EVENT_PUBLISHER: 'kafka' }),
    error => error instanceof ConfigError
      && error.invalid.includes('PORT')
      && error.invalid.includes('EVENT_PUBLISHER')
      && !error.message.includes('kafka')
      && !error.message.includes('segredo')
  );
});

test('Porta incompleta é rejeitada na composição', () => {
  assert.throws(() => assertPort('roomRepository', { findById: async () => null }), /save/);
});

test('Logger grava JSON e mascara dados pessoais e credenciais', () => {
  const lines = [];
  const logger = createLogger({ service: 'hotel-service', write: line => lines.push(line) });
  logger.info('hóspede 123.456.789-09 contato ana@exemplo.com', { correlationId: 'c1' });
  logger.error('falha', { error: new Error('não conectou em mongodb+srv://usuario:senha123@cluster.exemplo.net') });
  const entry = JSON.parse(lines[0]);
  assert.equal(entry.level, 'info');
  assert.equal(entry.correlationId, 'c1');
  assert.doesNotMatch(entry.message, /123\.456|ana@exemplo/);
  assert.doesNotMatch(lines[1], /usuario|senha123/);
});
