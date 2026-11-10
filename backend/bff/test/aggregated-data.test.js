// Critérios de aceite da Fase 5 para GET /aggregated-data, com servidores falsos reais.
const test = require('node:test');
const assert = require('node:assert/strict');
const { startEnvironment, closedPortUrl, INTERNAL_KEY, FUNCTION_KEY } = require('./support/downstream');

const PATH = '/aggregated-data?hotelId=h1&date=2026-11-10';

test('Tudo disponível: 200, partial false e cálculo correto da Function', async () => {
  const env = await startEnvironment();
  try {
    const token = await env.login();
    const response = await env.call('GET', PATH, { token, headers: { 'x-correlation-id': 'demo-123' } });
    assert.equal(response.status, 200);
    const data = response.body;
    assert.equal(data.metadata.partial, false);
    assert.deepEqual(data.metadata.errors, []);
    assert.equal(data.hotel.name, 'Hotel de Teste');
    // 2 quartos, 1 ocupado (a reserva cancelada não conta), diária 600/3 = 200.
    assert.deepEqual(
      { occupancyRate: data.calculations.occupancyRate, adr: data.calculations.adr, revPar: data.calculations.revPar, projectedRevenue: data.calculations.projectedRevenue },
      { occupancyRate: 50, adr: 200, revPar: 100, projectedRevenue: 6000 }
    );
    assert.equal(data.reservations[0].guest.name, 'Ana Souza', 'hóspede aninhado');
    assert.equal(data.reservations[0].room.number, '101', 'quarto aninhado');
    assert.deepEqual(data.guests.map(guest => guest.id).sort(), ['g1', 'g2'], 'só hóspedes das reservas');
    assert.equal(data.metadata.correlationId, 'demo-123');

    // Chaves e correlação propagadas.
    const catalogCall = env.hotel.requests.find(request => request.url === '/hotels/h1/catalog');
    assert.equal(catalogCall.headers['x-internal-api-key'], INTERNAL_KEY);
    assert.equal(catalogCall.headers['x-correlation-id'], 'demo-123');
    assert.equal(env.reservations.requests.find(request => request.url.startsWith('/reservations')).headers['x-internal-api-key'], INTERNAL_KEY);
    const functionCall = env.analytics.requests.at(-1);
    assert.equal(functionCall.url, '/api/httpTriggerAnalytics', 'URL da Function sem barra extra');
    assert.equal(functionCall.headers['x-functions-key'], FUNCTION_KEY);
    assert.deepEqual(functionCall.body, { hotelId: 'h1', date: '2026-11-10', totalRooms: 2, occupiedRooms: 1, roomRevenue: 200, daysInMonth: 30 });
  } finally {
    await env.close();
  }
});

test('Function lenta: 200, partial true, calculations null e erro TIMEOUT', async () => {
  const env = await startEnvironment({ timeoutMs: 300 });
  try {
    env.analytics.state.handler = () => ({ delayMs: 1500, body: {} });
    const response = await env.call('GET', PATH, { token: await env.login() });
    assert.equal(response.status, 200);
    assert.equal(response.body.metadata.partial, true);
    assert.equal(response.body.calculations, null);
    assert.deepEqual(response.body.metadata.errors.map(error => [error.source, error.code]), [['analytics-function', 'TIMEOUT']]);
    assert.equal(response.body.reservations.length, 2, 'demais dados preservados');
  } finally {
    await env.close();
  }
});

test('Function fora do ar: 200, partial true e erro UNAVAILABLE', async () => {
  const env = await startEnvironment({ overrides: { analytics: await closedPortUrl() } });
  try {
    const response = await env.call('GET', PATH, { token: await env.login() });
    assert.equal(response.status, 200);
    assert.equal(response.body.calculations, null);
    assert.deepEqual(response.body.metadata.errors.map(error => [error.source, error.code]), [['analytics-function', 'UNAVAILABLE']]);
  } finally {
    await env.close();
  }
});

test('Um microservice fora: 200, partial true, erro identificado e cálculo não executado', async () => {
  const env = await startEnvironment({ overrides: { reservations: await closedPortUrl() } });
  try {
    const response = await env.call('GET', PATH, { token: await env.login() });
    assert.equal(response.status, 200);
    assert.equal(response.body.metadata.partial, true);
    assert.equal(response.body.hotel.name, 'Hotel de Teste');
    assert.deepEqual(response.body.reservations, []);
    const sources = response.body.metadata.errors.map(error => `${error.source}:${error.code}`);
    assert.ok(sources.includes('reservations-service:UNAVAILABLE'));
    assert.ok(sources.includes('analytics-function:SKIPPED'));
  } finally {
    await env.close();
  }
});

test('Todas as fontes fora: 503 e o processo continua ativo', async () => {
  const down = await closedPortUrl();
  const env = await startEnvironment({ overrides: { reservations: down, analytics: down } });
  try {
    const token = await env.login(); // login usa o Hotel, que ainda está no ar
    await env.hotel.close();
    const response = await env.call('GET', PATH, { token });
    assert.equal(response.status, 503);
    assert.equal(response.body.error.code, 'ALL_SOURCES_UNAVAILABLE');
    assert.equal((await env.call('GET', '/health')).status, 200, 'BFF continua respondendo');
  } finally {
    await env.close().catch(() => undefined);
  }
});

test('Parâmetros ausentes ou inválidos: 400; hotel inexistente: 404; sem login: 401', async () => {
  const env = await startEnvironment();
  try {
    const token = await env.login();
    assert.equal((await env.call('GET', '/aggregated-data', { token })).status, 400);
    assert.equal((await env.call('GET', '/aggregated-data?hotelId=h1', { token })).status, 400);
    assert.equal((await env.call('GET', '/aggregated-data?hotelId=h1&date=2026-02-30', { token })).status, 400);
    assert.equal((await env.call('GET', '/aggregated-data?hotelId=outro&date=2026-11-10', { token })).status, 404);
    assert.equal((await env.call('GET', PATH)).status, 401);
  } finally {
    await env.close();
  }
});

test('includeCalculations=false não chama a Function e não marca resposta parcial', async () => {
  const env = await startEnvironment();
  try {
    const response = await env.call('GET', `${PATH}&includeCalculations=false`, { token: await env.login() });
    assert.equal(response.body.calculations, null);
    assert.equal(response.body.metadata.partial, false);
    assert.equal(env.analytics.requests.length, 0);
  } finally {
    await env.close();
  }
});
