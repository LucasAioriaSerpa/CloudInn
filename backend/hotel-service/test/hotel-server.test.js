const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createHotelServer } = require('../src/main');

test('Hotel Service responde 400 para JSON inválido no corpo da requisição (não 409)', async (t) => {
  const server = createHotelServer();

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = address.port;

  t.after(() => {
    server.close();
  });

  const response = await new Promise((resolve, reject) => {
    const req = http.request(
      `http://127.0.0.1:${port}/rooms/r1`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      },
      res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      }
    );
    req.on('error', reject);
    req.write('{ json_invalido_sem_fechar');
    req.end();
  });

  // Antes: respondia 409
  // Agora: responde 400
  assert.equal(response.statusCode, 400);
  const parsed = JSON.parse(response.body);
  const message = typeof parsed.error === 'string' ? parsed.error : parsed.error?.message;
  assert.ok(message.includes('inválido'));
});

test('Hotel Service: GET /health responde 200 com status ok', async (t) => {
  const server = createHotelServer();
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
  assert.equal(response.body.service, 'hotel-service');
});
