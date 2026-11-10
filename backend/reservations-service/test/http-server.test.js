const test = require('node:test');
const assert = require('node:assert/strict');
const { createHttpServer } = require('../src/api/http-server');
const { ConflictError } = require('../src/domain/errors');
const { buildTestServer, withServer, jsonClient, silentLogger } = require('./support/fakes');

async function createGuest(call, document = '123.456.789-00') {
  return (await call('POST', '/guests', { name: 'João Silva', document, email: 'Joao@Email.com' })).body;
}

const reservationBody = guestId => ({
  guestId, hotelId: 'hotel-1', roomId: 'room-1', checkInDate: '2026-11-10', checkOutDate: '2026-11-13', totalAmount: 450
});

test('Reservas: cria com Idempotency-Key no cabeçalho sem duplicar', async () => {
  const { server, ports } = buildTestServer();
  await withServer(server, async baseUrl => {
    const call = jsonClient(baseUrl);
    const guest = await createGuest(call);
    const first = await call('POST', '/reservations', reservationBody(guest.id), { 'idempotency-key': 'chave-1' });
    const second = await call('POST', '/reservations', reservationBody(guest.id), { 'idempotency-key': 'chave-1' });
    assert.equal(first.status, 201);
    assert.equal(first.body.status, 'confirmed');
    assert.equal(second.body.id, first.body.id);
    assert.equal(ports.reservationRepository.items.size, 1);
  });
});

test('Reservas: período sobreposto no mesmo quarto responde 409', async () => {
  const { server } = buildTestServer();
  await withServer(server, async baseUrl => {
    const call = jsonClient(baseUrl);
    const guest = await createGuest(call);
    assert.equal((await call('POST', '/reservations', reservationBody(guest.id), { 'idempotency-key': 'a' })).status, 201);
    const conflict = await call('POST', '/reservations', reservationBody(guest.id), { 'idempotency-key': 'b' });
    assert.equal(conflict.status, 409);
    assert.equal(conflict.body.error.code, 'CONFLICT');
  });
});

test('Reservas: CRUD, check-in, check-out e cancelamento pela API', async () => {
  const { server } = buildTestServer();
  await withServer(server, async baseUrl => {
    const call = jsonClient(baseUrl);
    const guest = await createGuest(call);
    const { body: reservation } = await call('POST', '/reservations', reservationBody(guest.id), { 'idempotency-key': 'ciclo' });

    assert.equal((await call('GET', `/reservations/${reservation.id}`)).body.code, reservation.code);
    assert.equal((await call('GET', '/reservations?hotelId=hotel-1&date=2026-11-11')).body.length, 1);
    assert.equal((await call('GET', '/reservations?hotelId=hotel-1&date=2026-11-13')).body.length, 0, 'dia do check-out não conta');

    const updated = await call('PUT', `/reservations/${reservation.id}`, { totalAmount: 500 });
    assert.equal(updated.body.totalAmount, 500);

    assert.equal((await call('POST', `/reservations/${reservation.id}/checkin`)).body.status, 'active');
    assert.equal((await call('PUT', `/reservations/${reservation.id}`, { totalAmount: 1 })).status, 409, 'reserva ativa não é editável');
    assert.equal((await call('POST', `/reservations/${reservation.id}/checkout`, { changedBy: 'recepcao' })).body.status, 'completed');

    const { body: other } = await call('POST', '/reservations', { ...reservationBody(guest.id), roomId: 'room-2' }, { 'idempotency-key': 'outra' });
    assert.equal((await call('DELETE', `/reservations/${other.id}`)).status, 204);
    assert.equal((await call('GET', `/reservations/${other.id}`)).body.status, 'cancelled', 'cancelamento preserva o registro');
  });
});

test('Reservas: validação de entrada e IDs', async () => {
  const { server } = buildTestServer();
  await withServer(server, async baseUrl => {
    const call = jsonClient(baseUrl);
    const guest = await createGuest(call);
    assert.equal((await call('POST', '/reservations', reservationBody(guest.id))).status, 400, 'sem Idempotency-Key');
    assert.equal((await call('POST', '/reservations', { ...reservationBody(guest.id), extra: 1 }, { 'idempotency-key': 'x' })).status, 400);
    assert.equal((await call('POST', '/reservations', { ...reservationBody(guest.id), totalAmount: -1 }, { 'idempotency-key': 'y' })).status, 400);
    assert.equal((await call('GET', '/reservations?status=quebrado')).status, 400);
    assert.equal((await call('GET', '/reservations/nao-e-guid')).status, 404);
    assert.equal((await call('POST', '/reservations/00000000-0000-0000-0000-000000000000/checkin')).status, 404);
  });
});

test('Hóspedes: CRUD com documento único e bloqueio de exclusão com reservas', async () => {
  const { server } = buildTestServer();
  await withServer(server, async baseUrl => {
    const call = jsonClient(baseUrl);
    const created = await call('POST', '/guests', { name: 'Maria', document: '111', email: 'Maria@X.com', vip: true });
    assert.equal(created.status, 201);
    assert.equal(created.body.email, 'maria@x.com');
    assert.equal(created.body.vip, true);

    assert.equal((await call('POST', '/guests', { name: 'Outra', document: '111' })).status, 409);
    assert.equal((await call('GET', '/guests?search=Mar')).body.length, 1);
    assert.equal((await call('PUT', `/guests/${created.body.id}`, { phone: '+55 11 90000-0000' })).body.phone, '+55 11 90000-0000');

    const second = await createGuest(call, '222');
    assert.equal((await call('PUT', `/guests/${second.id}`, { document: '111' })).status, 409, 'documento de outro hóspede');

    await call('POST', '/reservations', reservationBody(second.id), { 'idempotency-key': 'h1' });
    assert.equal((await call('DELETE', `/guests/${second.id}`)).status, 409, 'hóspede com reserva');
    assert.equal((await call('DELETE', `/guests/${created.body.id}`)).status, 204);
    assert.equal((await call('GET', `/guests/${created.body.id}`)).status, 404);
    assert.equal((await call('POST', '/guests', { name: 'Sem documento' })).status, 400);
  });
});

test('Documentação: OpenAPI cobre todas as rotas e o Swagger UI responde', async () => {
  const { server } = buildTestServer();
  await withServer(server, async baseUrl => {
    const spec = await (await fetch(`${baseUrl}/openapi.json`)).json();
    const expected = {
      '/reservations': ['get', 'post'],
      '/reservations/{id}': ['get', 'put', 'delete'],
      '/reservations/{id}/checkin': ['post'],
      '/reservations/{id}/checkout': ['post'],
      '/guests': ['get', 'post'],
      '/guests/{id}': ['get', 'put', 'delete'],
      '/health': ['get'],
      '/health/ready': ['get']
    };
    for (const [path, methods] of Object.entries(expected)) {
      for (const method of methods) assert.ok(spec.paths[path]?.[method], `OpenAPI sem ${method.toUpperCase()} ${path}`);
    }
    const docs = await fetch(`${baseUrl}/docs/`);
    assert.equal(docs.status, 200);
  });
});

test('Readiness responde 503 quando o banco falha, sem derrubar o liveness', async () => {
  const { server } = buildTestServer({ readinessCheck: async () => { throw new Error('banco em pausa'); } });
  await withServer(server, async baseUrl => {
    assert.equal((await fetch(`${baseUrl}/health/ready`)).status, 503);
    assert.equal((await fetch(`${baseUrl}/health`)).status, 200);
  });
});

test('Erros: JSON inválido 400, conflito 409 e erro inesperado 500 sem detalhes', async () => {
  const handlers = new Proxy({}, { get: () => ({ execute: async () => { throw new Error('detalhe interno do banco'); } }) });
  const failing = createHttpServer({ handlers: { ...Object.fromEntries(['listReservations', 'createReservation'].map(name => [name, handlers[name]])), getGuest: { execute: async () => { throw new ConflictError('conflito'); } } }, logger: silentLogger });
  await withServer(failing, async baseUrl => {
    const call = jsonClient(baseUrl);
    assert.equal((await call('POST', '/reservations', '{x')).status, 400);
    assert.equal((await call('POST', '/reservations', 'null')).status, 400);
    assert.equal((await call('GET', '/guests/qualquer')).status, 409);
    const unexpected = await call('GET', '/reservations');
    assert.equal(unexpected.status, 500);
    assert.doesNotMatch(unexpected.body.error.message, /detalhe interno/);
  });
});
