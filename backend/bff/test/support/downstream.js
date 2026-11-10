// Servidores HTTP falsos para Hotel Service, Reservas Service e Azure Function.
// A Function falsa usa o cálculo REAL da Function (lib/analytics.js), então o contrato entre BFF e Function é testado.
const http = require('node:http');
const { calculate, ValidationError } = require('../../../api/functions/analytics-function/src/lib/analytics');
const { loadConfig } = require('../../src/config');
const { composeBff } = require('../../src/compose');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const INTERNAL_KEY = 'chave-interna-de-teste';
const FUNCTION_KEY = 'chave-da-function-de-teste';

async function startFake(handler) {
  const requests = [];
  const sockets = new Set();
  const state = { handler };
  const server = http.createServer(async (request, response) => {
    let raw = '';
    for await (const chunk of request) raw += chunk;
    const entry = { method: request.method, url: request.url, headers: request.headers, body: raw ? JSON.parse(raw) : undefined };
    requests.push(entry);
    const { status = 200, body, delayMs = 0 } = (await state.handler(entry)) || {};
    if (delayMs) await sleep(delayMs);
    if (response.destroyed) return;
    response.statusCode = status;
    if (body === undefined) return response.end();
    response.setHeader('content-type', 'application/json');
    return response.end(JSON.stringify(body));
  });
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    requests,
    state,
    close: () => { for (const socket of sockets) socket.destroy(); return new Promise(resolve => server.close(resolve)); }
  };
}

// Porta sem servidor: conexão recusada (serviço fora do ar).
async function closedPortUrl() {
  const server = http.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  await new Promise(resolve => server.close(resolve));
  return `http://127.0.0.1:${port}`;
}

const CATALOG = {
  hotel: { id: 'h1', code: 'TESTE', name: 'Hotel de Teste' },
  rooms: [
    { id: 'r1', hotelId: 'h1', number: '101', roomType: 'STD', status: 'occupied' },
    { id: 'r2', hotelId: 'h1', number: '102', roomType: 'DLX', status: 'available' }
  ],
  summary: { totalRooms: 2, byStatus: { available: 1, reserved: 0, occupied: 1, dirty: 0, cleaning: 0 } }
};

const RESERVATIONS = [
  { id: 'res1', code: 'RSV-1', guestId: 'g1', hotelId: 'h1', roomId: 'r1', checkInDate: '2026-11-09', checkOutDate: '2026-11-12', status: 'active', totalAmount: 600 },
  { id: 'res2', code: 'RSV-2', guestId: 'g2', hotelId: 'h1', roomId: 'r2', checkInDate: '2026-11-09', checkOutDate: '2026-11-12', status: 'cancelled', totalAmount: 900 }
];

const GUESTS = [
  { id: 'g1', name: 'Ana Souza', document: '111' },
  { id: 'g2', name: 'Bruno Lima', document: '222' },
  { id: 'g3', name: 'Sem reserva hoje', document: '333' }
];

const STAFF = {
  gerente: { id: 's1', username: 'gerente', name: 'Mariana Costa', role: 'manager', hotelId: 'h1' },
  recepcao: { id: 's2', username: 'recepcao', name: 'Lucas Oliveira', role: 'receptionist', hotelId: 'h1' }
};
const PASSWORD = 'senha-correta-1';

function hotelHandler(entry) {
  const path = entry.url.split('?')[0];
  if (path === '/health/ready') return { body: { status: 'ready' } };
  if (path === '/staff/verify-credentials') {
    const staff = STAFF[entry.body?.login];
    return staff && entry.body.password === PASSWORD
      ? { body: staff }
      : { status: 401, body: { error: { code: 'UNAUTHORIZED', message: 'Credenciais inválidas.' } } };
  }
  if (path === '/hotels/h1/catalog') return { body: CATALOG };
  if (path.startsWith('/hotels/')) return { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Hotel not found' } } };
  if (entry.method === 'POST' && path === '/rooms') return { status: 409, body: { error: { code: 'CONFLICT', message: 'Já existe um quarto com este número neste hotel.' } } };
  if (entry.method === 'DELETE') return { status: 204 };
  return { body: { proxied: 'hotel-service', method: entry.method, url: entry.url } };
}

function reservationsHandler(entry) {
  const path = entry.url.split('?')[0];
  if (path === '/health/ready') return { body: { status: 'ready' } };
  if (entry.method === 'GET' && path === '/reservations') return { body: RESERVATIONS };
  if (entry.method === 'GET' && path === '/guests') return { body: GUESTS };
  return { status: entry.method === 'POST' && path === '/reservations' ? 201 : 200, body: { proxied: 'reservations-service', url: entry.url, received: entry.body ?? null } };
}

function functionHandler(entry) {
  if (entry.headers['x-functions-key'] !== FUNCTION_KEY) return { status: 401 };
  try {
    return { body: calculate(entry.body) };
  } catch (error) {
    return { status: error instanceof ValidationError ? 400 : 500, body: { error: error.message } };
  }
}

const silentLogger = { debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined };

// Sobe os três falsos e um BFF real apontando para eles. overrides troca URLs (ex.: serviço fora do ar).
async function startEnvironment({ overrides = {}, timeoutMs = 400, env = {} } = {}) {
  const hotel = await startFake(hotelHandler);
  const reservations = await startFake(reservationsHandler);
  const analytics = await startFake(functionHandler);
  const config = loadConfig({
    HOTEL_SERVICE_URL: overrides.hotel ?? hotel.url,
    RESERVATIONS_SERVICE_URL: overrides.reservations ?? reservations.url,
    ANALYTICS_FUNCTION_URL: overrides.analytics ?? `${analytics.url}/api/httpTriggerAnalytics`,
    ANALYTICS_FUNCTION_KEY: FUNCTION_KEY,
    INTERNAL_API_KEY: INTERNAL_KEY,
    JWT_SECRET: 'segredo-jwt-de-teste-com-mais-de-32-caracteres',
    CORS_ORIGINS: 'https://frontend.exemplo.net',
    DOWNSTREAM_TIMEOUT_MS: String(timeoutMs),
    ...env
  });
  const bff = composeBff(config, { logger: silentLogger, clock: { now: () => new Date('2026-11-10T12:00:00Z') } });
  await new Promise(resolve => bff.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${bff.address().port}`;

  const call = async (method, path, { body, token, headers = {} } = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await response.text();
    return { status: response.status, headers: response.headers, body: text ? JSON.parse(text) : null };
  };
  const login = async (user = 'gerente') => (await call('POST', '/auth/login', { body: { login: user, password: PASSWORD } })).body.token;

  return {
    baseUrl, call, login, hotel, reservations, analytics,
    close: async () => {
      await new Promise(resolve => bff.close(resolve));
      await Promise.all([hotel.close(), reservations.close(), analytics.close()]);
    }
  };
}

module.exports = { startEnvironment, closedPortUrl, INTERNAL_KEY, FUNCTION_KEY, PASSWORD, CATALOG, RESERVATIONS };
