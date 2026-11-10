const test = require('node:test');
const assert = require('node:assert/strict');
const { buildTestServer, withServer, jsonClient } = require('./support/fakes');

const roomBody = (hotelId, extra = {}) => ({ hotelId, number: '101', roomType: 'STD', floor: 1, ...extra });

test('Quartos: CRUD completo com regras de status', async () => {
  const { server, hotelId } = buildTestServer();
  await withServer(server, async baseUrl => {
    const call = jsonClient(baseUrl);

    const created = await call('POST', '/rooms', roomBody(hotelId));
    assert.equal(created.status, 201);
    assert.match(created.body.id, /^[0-9a-f]{24}$/);
    assert.equal(created.body.status, 'available');
    const id = created.body.id;

    const list = await call('GET', `/rooms?hotelId=${hotelId}`);
    assert.equal(list.status, 200);
    assert.equal(list.body.length, 1);

    assert.equal((await call('GET', `/rooms/${id}`)).body.number, '101');

    const updated = await call('PUT', `/rooms/${id}`, { number: '101', roomType: 'DLX', floor: 1, amenities: ['wifi'] });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.roomType, 'DLX');

    assert.equal((await call('PATCH', `/rooms/${id}/status`, { status: 'reserved' })).status, 200);
    assert.equal((await call('DELETE', `/rooms/${id}`)).status, 409, 'quarto reservado não pode ser excluído');
    assert.equal((await call('PATCH', `/rooms/${id}/status`, { status: 'available' })).status, 200);

    assert.equal((await call('DELETE', `/rooms/${id}`)).status, 204);
    assert.equal((await call('GET', `/rooms/${id}`)).status, 404);
  });
});

test('Quartos: número duplicado no mesmo hotel responde 409', async () => {
  const { server, hotelId } = buildTestServer();
  await withServer(server, async baseUrl => {
    const call = jsonClient(baseUrl);
    assert.equal((await call('POST', '/rooms', roomBody(hotelId))).status, 201);
    const duplicate = await call('POST', '/rooms', roomBody(hotelId));
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.error.code, 'CONFLICT');
  });
});

test('Quartos: validação de entrada responde 400', async () => {
  const { server, hotelId } = buildTestServer();
  await withServer(server, async baseUrl => {
    const call = jsonClient(baseUrl);
    assert.equal((await call('POST', '/rooms', roomBody(hotelId, { roomType: 'XXX' }))).status, 400);
    const unknownField = await call('POST', '/rooms', roomBody(hotelId, { id: 'forjado' }));
    assert.equal(unknownField.status, 400);
    assert.match(unknownField.body.error.message, /campos não permitidos: id/);
    assert.equal((await call('POST', '/rooms', { hotelId, roomType: 'STD' })).status, 400);
    assert.equal((await call('POST', '/rooms', roomBody('000000000000000000000000'))).status, 400, 'hotel inexistente');
    assert.equal((await call('POST', '/rooms', '{x')).status, 400);
    assert.equal((await call('GET', '/rooms?status=quebrado')).status, 400);
  });
});

test('Quartos: PUT não altera status e PATCH aplica transições', async () => {
  const { server, hotelId, events } = buildTestServer();
  await withServer(server, async baseUrl => {
    const call = jsonClient(baseUrl);
    const { body: room } = await call('POST', '/rooms', roomBody(hotelId, { status: 'cleaning' }));

    assert.equal((await call('PUT', `/rooms/${room.id}`, { number: '101', roomType: 'STD', status: 'available' })).status, 400);
    assert.equal((await call('PATCH', `/rooms/${room.id}/status`, {})).status, 400);
    assert.equal((await call('PATCH', `/rooms/${room.id}/status`, { status: 'occupied' })).status, 409);

    const freed = await call('PATCH', `/rooms/${room.id}/status`, { status: 'available', staffId: 's1' });
    assert.equal(freed.status, 200);
    assert.equal(events.length, 1);
    assert.equal(events[0].type, 'RoomCleaningCompleted');
    assert.deepEqual(events[0].data, { roomId: room.id, hotelId, staffId: 's1', status: 'available' });
  });
});

test('Quartos: ID inexistente ou mal formado responde 404', async () => {
  const { server } = buildTestServer();
  await withServer(server, async baseUrl => {
    const call = jsonClient(baseUrl);
    assert.equal((await call('GET', '/rooms/nao-e-um-id')).status, 404);
    assert.equal((await call('PATCH', '/rooms/nao-e-um-id/status', { status: 'available' })).status, 404);
  });
});

const staffBody = (hotelId, extra = {}) => ({
  hotelId, name: 'Ana Souza', username: 'Ana.Souza', email: 'Ana@CloudInn.com', role: 'receptionist', password: 'senha-forte-1', ...extra
});

test('Staff: cria sem expor senha e verifica credenciais por username ou e-mail', async () => {
  const { server, hotelId } = buildTestServer();
  await withServer(server, async baseUrl => {
    const call = jsonClient(baseUrl);
    const created = await call('POST', '/staff', staffBody(hotelId));
    assert.equal(created.status, 201);
    assert.equal(created.body.username, 'ana.souza');
    assert.equal(created.body.email, 'ana@cloudinn.com');
    assert.equal('password' in created.body, false);
    assert.equal('passwordHash' in created.body, false);

    const fetched = await call('GET', `/staff/${created.body.id}`);
    assert.equal('passwordHash' in fetched.body, false);

    assert.equal((await call('POST', '/staff/verify-credentials', { login: 'ana.souza', password: 'senha-forte-1' })).status, 200);
    assert.equal((await call('POST', '/staff/verify-credentials', { login: 'ANA@cloudinn.com', password: 'senha-forte-1' })).status, 200);

    const wrong = await call('POST', '/staff/verify-credentials', { login: 'ana.souza', password: 'errada-123' });
    const unknown = await call('POST', '/staff/verify-credentials', { login: 'ninguem', password: 'senha-forte-1' });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.body.error.message, unknown.body.error.message, 'mesma mensagem para não revelar logins');
  });
});

test('Staff: troca de senha, inativação, duplicidade e exclusão', async () => {
  const { server, hotelId } = buildTestServer();
  await withServer(server, async baseUrl => {
    const call = jsonClient(baseUrl);
    const { body: staff } = await call('POST', '/staff', staffBody(hotelId));
    const base = { name: 'Ana Souza', username: 'ana.souza', role: 'receptionist' };

    assert.equal((await call('PUT', `/staff/${staff.id}`, { ...base, password: 'nova-senha-2' })).status, 200);
    assert.equal((await call('POST', '/staff/verify-credentials', { login: 'ana.souza', password: 'senha-forte-1' })).status, 401);
    assert.equal((await call('POST', '/staff/verify-credentials', { login: 'ana.souza', password: 'nova-senha-2' })).status, 200);

    assert.equal((await call('PUT', `/staff/${staff.id}`, { ...base, status: 'inactive' })).status, 200);
    assert.equal((await call('POST', '/staff/verify-credentials', { login: 'ana.souza', password: 'nova-senha-2' })).status, 401, 'inativo não entra');

    assert.equal((await call('POST', '/staff', staffBody(hotelId, { email: 'outra@cloudinn.com' }))).status, 409, 'username duplicado');
    assert.equal((await call('POST', '/staff', staffBody(hotelId, { username: 'outro', password: 'curta' }))).status, 400, 'senha curta');
    assert.equal((await call('GET', '/staff?role=chefe')).status, 400);

    assert.equal((await call('DELETE', `/staff/${staff.id}`)).status, 204);
    assert.equal((await call('GET', `/staff/${staff.id}`)).status, 404);
  });
});

test('Catálogo: hotel, quartos e contagem por status', async () => {
  const { server, hotelId } = buildTestServer();
  await withServer(server, async baseUrl => {
    const call = jsonClient(baseUrl);
    await call('POST', '/rooms', roomBody(hotelId, { number: '101' }));
    await call('POST', '/rooms', roomBody(hotelId, { number: '102', status: 'occupied' }));

    const catalog = await call('GET', `/hotels/${hotelId}/catalog`);
    assert.equal(catalog.status, 200);
    assert.equal(catalog.body.hotel.id, hotelId);
    assert.equal(catalog.body.rooms.length, 2);
    assert.equal(catalog.body.summary.totalRooms, 2);
    assert.equal(catalog.body.summary.byStatus.occupied, 1);
    assert.equal(catalog.body.summary.byStatus.available, 1);

    assert.equal((await call('GET', '/hotels/000000000000000000000000/catalog')).status, 404);
  });
});

test('Documentação: OpenAPI cobre todas as rotas e o Swagger UI responde', async () => {
  const { server } = buildTestServer();
  await withServer(server, async baseUrl => {
    const spec = await (await fetch(`${baseUrl}/openapi.json`)).json();
    const expected = {
      '/rooms': ['get', 'post'],
      '/rooms/{id}': ['get', 'put', 'delete'],
      '/rooms/{id}/status': ['patch'],
      '/staff': ['get', 'post'],
      '/staff/{id}': ['get', 'put', 'delete'],
      '/staff/verify-credentials': ['post'],
      '/hotels/{id}/catalog': ['get'],
      '/health': ['get'],
      '/health/ready': ['get']
    };
    for (const [path, methods] of Object.entries(expected)) {
      for (const method of methods) assert.ok(spec.paths[path]?.[method], `OpenAPI sem ${method.toUpperCase()} ${path}`);
    }
    const docs = await fetch(`${baseUrl}/docs/`);
    assert.equal(docs.status, 200);
    assert.match(await docs.text(), /swagger-ui/i);
  });
});

test('Readiness: 200 com banco acessível e 503 quando o banco falha', async () => {
  const healthy = buildTestServer({ readinessCheck: async () => undefined });
  await withServer(healthy.server, async baseUrl => {
    assert.equal((await fetch(`${baseUrl}/health/ready`)).status, 200);
  });
  const broken = buildTestServer({ readinessCheck: async () => { throw new Error('sem conexão'); } });
  await withServer(broken.server, async baseUrl => {
    assert.equal((await fetch(`${baseUrl}/health/ready`)).status, 503);
    assert.equal((await fetch(`${baseUrl}/health`)).status, 200, 'liveness não depende do banco');
  });
});
