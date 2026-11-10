const test = require('node:test');
const assert = require('node:assert/strict');
const { startEnvironment, closedPortUrl, INTERNAL_KEY } = require('./support/downstream');

test('Login: emite JWT, /auth/me lê o token e senha errada responde 401', async () => {
  const env = await startEnvironment();
  try {
    const login = await env.call('POST', '/auth/login', { body: { login: 'gerente', password: 'senha-correta-1' } });
    assert.equal(login.status, 200);
    assert.equal(login.body.tokenType, 'Bearer');
    assert.equal(login.body.user.role, 'manager');
    const me = await env.call('GET', '/auth/me', { token: login.body.token });
    assert.deepEqual([me.body.username, me.body.role, me.body.hotelId], ['gerente', 'manager', 'h1']);

    assert.equal((await env.call('POST', '/auth/login', { body: { login: 'gerente', password: 'errada' } })).status, 401);
    assert.equal((await env.call('POST', '/auth/login', { body: { login: 'gerente' } })).status, 400);
    assert.equal((await env.call('GET', '/auth/me', { token: 'token.forjado.x' })).status, 401);
  } finally {
    await env.close();
  }
});

test('Login com Hotel Service fora do ar responde 503', async () => {
  const env = await startEnvironment({ overrides: { hotel: await closedPortUrl() } });
  try {
    const response = await env.call('POST', '/auth/login', { body: { login: 'gerente', password: 'x' } });
    assert.equal(response.status, 503);
    assert.equal(response.body.error.code, 'UNAVAILABLE');
  } finally {
    await env.close();
  }
});

test('Proxy: repassa método, caminho, query, chave interna e preserva status do microservice', async () => {
  const env = await startEnvironment();
  try {
    const token = await env.login();
    const rooms = await env.call('GET', '/rooms?status=available&hotelId=h1', { token });
    assert.equal(rooms.status, 200);
    assert.equal(rooms.body.url, '/rooms?status=available&hotelId=h1');
    assert.equal(env.hotel.requests.at(-1).headers['x-internal-api-key'], INTERNAL_KEY);

    const conflict = await env.call('POST', '/rooms', { token, body: { hotelId: 'h1', number: '101', roomType: 'STD' } });
    assert.equal(conflict.status, 409, '4xx do microservice é preservado');
    assert.equal(conflict.body.error.code, 'CONFLICT');

    assert.equal((await env.call('DELETE', '/rooms/r2', { token })).status, 204);
    assert.equal((await env.call('GET', '/rooms')).status, 401, 'proxy exige login');
  } finally {
    await env.close();
  }
});

test('Proxy de reservas: repassa Idempotency-Key e registra o usuário logado na auditoria', async () => {
  const env = await startEnvironment();
  try {
    const token = await env.login('recepcao');
    const created = await env.call('POST', '/reservations', {
      token,
      headers: { 'idempotency-key': 'chave-123' },
      body: { guestId: 'g1', hotelId: 'h1', roomId: 'r1', checkInDate: '2026-11-10', checkOutDate: '2026-11-12', totalAmount: 400 }
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.received.changedBy, 'recepcao');
    assert.equal(env.reservations.requests.at(-1).headers['idempotency-key'], 'chave-123');

    const checkin = await env.call('POST', '/reservations/res1/checkin', { token });
    assert.equal(checkin.body.received.changedBy, 'recepcao', 'check-in sem corpo também é auditado');

    const update = await env.call('PUT', '/reservations/res1', { token, body: { totalAmount: 500 } });
    assert.deepEqual(update.body.received, { totalAmount: 500 }, 'PUT não recebe campos extras');
  } finally {
    await env.close();
  }
});

test('Permissões: só gerência altera staff; verificação de senha não é exposta', async () => {
  const env = await startEnvironment();
  try {
    const receptionist = await env.login('recepcao');
    const manager = await env.login('gerente');
    assert.equal((await env.call('GET', '/staff', { token: receptionist })).status, 200);
    assert.equal((await env.call('POST', '/staff', { token: receptionist, body: {} })).status, 403);
    assert.equal((await env.call('POST', '/staff', { token: manager, body: {} })).status, 200);
    assert.equal((await env.call('POST', '/staff/verify-credentials', { token: manager, body: { login: 'gerente', password: 'x' } })).status, 404);
  } finally {
    await env.close();
  }
});

test('Proxy com microservice lento responde 503 TIMEOUT', async () => {
  const env = await startEnvironment({ timeoutMs: 300 });
  try {
    const token = await env.login();
    env.hotel.state.handler = () => ({ delayMs: 1500, body: {} });
    const response = await env.call('GET', '/rooms', { token });
    assert.equal(response.status, 503);
    assert.equal(response.body.error.code, 'TIMEOUT');
  } finally {
    await env.close();
  }
});

test('CORS: origem permitida recebe cabeçalhos; outra origem não', async () => {
  const env = await startEnvironment();
  try {
    const preflight = await fetch(`${env.baseUrl}/aggregated-data`, {
      method: 'OPTIONS',
      headers: { origin: 'https://frontend.exemplo.net', 'access-control-request-method': 'GET' }
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://frontend.exemplo.net');
    assert.match(preflight.headers.get('access-control-allow-headers'), /Authorization/);

    const other = await fetch(`${env.baseUrl}/health`, { headers: { origin: 'https://site-estranho.com' } });
    assert.equal(other.headers.get('access-control-allow-origin'), null);
  } finally {
    await env.close();
  }
});

test('Saúde: /health informa transporte HTTP e /health/dependencies mostra cada serviço', async () => {
  const env = await startEnvironment({ overrides: { reservations: await closedPortUrl() } });
  try {
    assert.deepEqual((await env.call('GET', '/health')).body, { status: 'ok', service: 'bff', transport: 'http' });
    const dependencies = await env.call('GET', '/health/dependencies');
    assert.equal(dependencies.status, 503);
    assert.equal(dependencies.body.dependencies['hotel-service'].status, 'up');
    assert.equal(dependencies.body.dependencies['reservations-service'].status, 'down');
    assert.equal(dependencies.body.dependencies['analytics-function'].status, 'up');
  } finally {
    await env.close();
  }
});

test('Documentação: OpenAPI cobre todas as rotas e o Swagger UI responde', async () => {
  const env = await startEnvironment();
  try {
    const spec = (await env.call('GET', '/openapi.json')).body;
    const expected = {
      '/auth/login': ['post'], '/auth/me': ['get'], '/aggregated-data': ['get'],
      '/health': ['get'], '/health/dependencies': ['get'],
      '/rooms': ['get', 'post'], '/rooms/{id}': ['get', 'put', 'delete'], '/rooms/{id}/status': ['patch'],
      '/staff': ['get', 'post'], '/staff/{id}': ['get', 'put', 'delete'], '/hotels/{id}/catalog': ['get'],
      '/reservations': ['get', 'post'], '/reservations/{id}': ['get', 'put', 'delete'],
      '/reservations/{id}/checkin': ['post'], '/reservations/{id}/checkout': ['post'],
      '/guests': ['get', 'post'], '/guests/{id}': ['get', 'put', 'delete']
    };
    for (const [path, methods] of Object.entries(expected)) {
      for (const method of methods) assert.ok(spec.paths[path]?.[method], `OpenAPI sem ${method.toUpperCase()} ${path}`);
    }
    assert.equal((await fetch(`${env.baseUrl}/docs/`)).status, 200);
  } finally {
    await env.close();
  }
});
