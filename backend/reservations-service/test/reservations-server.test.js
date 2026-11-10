const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createServer } = require('../src/main');

test('Reservations Service: POST válido com Idempotency-Key no header responde 201 e tolera referências circulares', async (t) => {
  const mockHandler = {
    execute: async (command) => {
      // Valida que a chave foi devidamente extraída do cabeçalho HTTP
      if (!command.idempotencyKey) {
        const error = new Error('Idempotency-Key é obrigatória.');
        error.name = 'MissingIdempotencyKeyError';
        throw error;
      }

      // Simula objeto de resposta com referência circular
      const response = {
        reservationId: 'uuid-123',
        status: 'CONFIRMED',
        code: 'RSV-ABC12'
      };
      response.self = response; // Estrutura circular

      return response;
    }
  };

  const server = createServer(mockHandler);

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = address.port;

  t.after(() => {
    server.close();
  });

  const payload = JSON.stringify({
    guestId: '11111111-1111-1111-1111-111111111111',
    hotelId: 'hotel-1',
    roomId: 'room-1',
    checkInDate: '2026-11-10',
    checkOutDate: '2026-11-13',
    totalAmount: 450
  });

  const res = await new Promise((resolve, reject) => {
    const req = http.request(
      `http://127.0.0.1:${port}/reservations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'chave-idempotente-001',
          'x-internal-api-key': 'dev-internal-key'
        }
      },
      response => {
        let body = '';
        response.on('data', chunk => { body += chunk; });
        response.on('end', () => resolve({ statusCode: response.statusCode, body }));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });

  // Antes: respondia 400 por não ler o header Idempotency-Key e quebrava ao serializar estrutura circular
  // Agora: responde 201 com serialização segura
  assert.equal(res.statusCode, 201);
  const data = JSON.parse(res.body);
  assert.equal(data.reservationId, 'uuid-123');
  assert.equal(data.self, '[Circular]');
});

test('Reservations Service: requisição sem Idempotency-Key responde 400 com erro de domínio mapeado', async (t) => {
  const { CreateReservationHandler } = require('../src/features/reservations/create-reservation/handler');
  const handler = new CreateReservationHandler({
    reservationRepository: {},
    idempotencyRepository: {},
    unitOfWork: { transaction: async op => op({}) }
  });

  const server = createServer(handler);

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = address.port;

  t.after(() => {
    server.close();
  });

  const payload = JSON.stringify({
    guestId: '11111111-1111-1111-1111-111111111111',
    totalAmount: 450
  });

  const res = await new Promise((resolve, reject) => {
    const req = http.request(
      `http://127.0.0.1:${port}/reservations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': 'dev-internal-key'
        }
      },
      response => {
        let body = '';
        response.on('data', chunk => { body += chunk; });
        response.on('end', () => resolve({ statusCode: response.statusCode, body }));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });

  assert.equal(res.statusCode, 400);
  const data = JSON.parse(res.body);
  const message = typeof data.error === 'string' ? data.error : data.error?.message;
  assert.ok(message.includes('Idempotency-Key'));
});

test('Reservas Service: GET /health responde 200 com status ok', async (t) => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  t.after(() => server.close());

  const response = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/health`, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
    }).on('error', reject);
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.service, 'reservations-service');
});
