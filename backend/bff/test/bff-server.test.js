const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createBffServer } = require('../src/main');

test('BFF trata exceção no handler retornando 500 sem derrubar o processo', async (t) => {
  const failingHandler = {
    execute: async () => {
      throw new Error('Falha catastrófica simulada no gateway downstream');
    }
  };

  const server = createBffServer(failingHandler);

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const port = address.port;

  t.after(() => {
    server.close();
  });

  const response = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/aggregated-data?hotelId=h1&date=2026-11-10`, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    }).on('error', reject);
  });

  // Antes: exceção não tratada no http.createServer encerrava o processo ou deixava requisição pendente
  // Agora: responde 500 com JSON de erro e o processo continua ativo
  assert.equal(response.statusCode, 500);
  const parsed = JSON.parse(response.body);
  assert.equal(parsed.error.code, 'INTERNAL_ERROR');
  assert.ok(parsed.error.message.includes('catastrófica'));

  // Comprova que o servidor continua vivo atendendo requisições subsequentes
  const healthRes = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/health`, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    }).on('error', reject);
  });

  assert.equal(healthRes.statusCode, 200);
});
