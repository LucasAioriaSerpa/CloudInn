#!/usr/bin/env node
// Testa o sistema publicado pelas URLs reais. Nunca imprime chaves.
//
// Uso:
//   1. Copie scripts/integration.env.example para .env.integration (ignorado pelo Git) e preencha.
//   2. npm run check:integration -- --env-file .env.integration
//
// Opções:
//   --allow-localhost   aceita URLs locais (para testar com Docker Compose)
//   --strict            itens PENDENTE também contam como falha (use na entrega)
//   --write             também testa o CRUD real: cria, altera e apaga um quarto e um hóspede de teste
const path = require('node:path');
const fs = require('node:fs');
const { parseEnvFile, withoutPlaceholders } = require('./lib/env-file');

const args = process.argv.slice(2);
const envFileIndex = args.indexOf('--env-file');
const allowLocalhost = args.includes('--allow-localhost');
const strict = args.includes('--strict');
const TIMEOUT_MS = 20000; // folga para cold start dos planos gratuitos

let fileValues = {};
if (envFileIndex >= 0) {
  const file = path.resolve(args[envFileIndex + 1] || '');
  if (!fs.existsSync(file)) {
    console.error(`Arquivo não encontrado: ${file}`);
    process.exit(1);
  }
  fileValues = parseEnvFile(file);
}
const env = withoutPlaceholders({ ...process.env, ...fileValues });

const results = [];
const record = (name, status, detail = '') => results.push({ name, status, detail });

function validateUrl(name, value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return `${name} não é uma URL válida.`;
  }
  if (url.username || url.password) return `${name} contém usuário ou senha embutidos.`;
  if ([...url.searchParams.keys()].some(key => /^(code|key|token|sig|api[_-]?key)$/i.test(key))) {
    return `${name} contém credencial na query string; informe a chave separadamente.`;
  }
  if (!allowLocalhost && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(url.hostname)) {
    return `${name} aponta para localhost; use a URL pública ou --allow-localhost.`;
  }
  return null;
}

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const text = await response.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = null; }
  return { status: response.status, body };
}

const base = value => value.replace(/\/+$/, '');

async function checkHealth(label, variable) {
  const value = env[variable];
  if (!value) return record(`${label} /health`, 'PENDENTE', `defina ${variable}`);
  const invalid = validateUrl(variable, value);
  if (invalid) return record(`${label} /health`, 'FALHA', invalid);
  try {
    const { status, body } = await request(`${base(value)}/health`);
    if (status !== 200 || body?.status !== 'ok') return record(`${label} /health`, 'FALHA', `HTTP ${status}`);
    if (body.transport === 'simulated') return record(`${label} /health`, 'FALHA', 'responde, mas usa transporte SIMULADO (Fase 5 pendente)');
    if (body.persistence === 'memory') return record(`${label} /health`, 'FALHA', 'responde, mas guarda dados em MEMÓRIA (Fase 3 pendente)');
    return record(`${label} /health`, 'OK', JSON.stringify(body));
  } catch (error) {
    return record(`${label} /health`, 'FALHA', error.name === 'TimeoutError' ? `sem resposta em ${TIMEOUT_MS / 1000}s` : error.message);
  }
}

async function checkAggregatedData() {
  const name = 'BFF /aggregated-data';
  if (!env.CHECK_BFF_URL || validateUrl('CHECK_BFF_URL', env.CHECK_BFF_URL)) return record(name, 'PENDENTE', 'depende de CHECK_BFF_URL válido');
  if (!env.CHECK_HOTEL_ID || !env.CHECK_DATE) return record(name, 'PENDENTE', 'defina CHECK_HOTEL_ID e CHECK_DATE');
  if (!env.CHECK_LOGIN || !env.CHECK_PASSWORD) return record(name, 'PENDENTE', 'defina CHECK_LOGIN e CHECK_PASSWORD (o endpoint exige login)');
  try {
    const gatewayKey = env.CHECK_API_KEY ? { 'x-api-key': env.CHECK_API_KEY } : {};
    const login = await request(`${base(env.CHECK_BFF_URL)}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...gatewayKey },
      body: JSON.stringify({ login: env.CHECK_LOGIN, password: env.CHECK_PASSWORD })
    });
    if (login.status !== 200 || !login.body?.token) return record('BFF /auth/login', 'FALHA', `HTTP ${login.status}`);
    record('BFF /auth/login', 'OK', `usuário ${login.body.user?.username} (${login.body.user?.role})`);

    const query = new URLSearchParams({ hotelId: env.CHECK_HOTEL_ID, date: env.CHECK_DATE });
    const { status, body } = await request(`${base(env.CHECK_BFF_URL)}/aggregated-data?${query}`, {
      headers: { authorization: `Bearer ${login.body.token}`, ...gatewayKey }
    });
    const keys = ['hotel', 'reservations', 'calculations', 'metadata'];
    const missingKeys = keys.filter(key => !(body && key in body));
    if (status !== 200 || missingKeys.length) return record(name, 'FALHA', `HTTP ${status}; campos ausentes: ${missingKeys.join(', ') || 'nenhum'}`);
    if (body.metadata?.partial) return record(name, 'AVISO', `resposta parcial: ${JSON.stringify(body.metadata.errors)}`);
    return record(name, 'OK', 'hotel, reservas e cálculos presentes');
  } catch (error) {
    return record(name, 'FALHA', error.message);
  }
}

async function checkFunction() {
  const name = 'Function protegida por chave';
  const value = env.CHECK_FUNCTION_URL;
  if (!value) return record(name, 'PENDENTE', 'defina CHECK_FUNCTION_URL (endpoint httpTriggerAnalytics, sem ?code=)');
  const invalid = validateUrl('CHECK_FUNCTION_URL', value);
  if (invalid) return record(name, 'FALHA', invalid);
  try {
    // Sem chave, a Function deve recusar (authLevel: function). Não envia dados nem altera estado.
    const { status } = await request(value, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    return record(name, status === 401 ? 'OK' : 'FALHA', `sem chave: HTTP ${status} (esperado 401)`);
  } catch (error) {
    return record(name, 'FALHA', error.message);
  }
}

// CRUD real pelo BFF (MongoDB e Azure SQL). Grava dados, por isso só roda com --write:
// cria um quarto e um hóspede de teste, lê, altera e apaga os dois.
async function checkCrud() {
  const name = 'CRUD pelo BFF (MongoDB e Azure SQL)';
  if (!args.includes('--write')) return record(name, 'PENDENTE', 'rode com --write (cria e apaga um quarto e um hóspede de teste)');
  if (!env.CHECK_BFF_URL || !env.CHECK_LOGIN || !env.CHECK_PASSWORD || !env.CHECK_HOTEL_ID) {
    return record(name, 'PENDENTE', 'defina CHECK_BFF_URL, CHECK_LOGIN, CHECK_PASSWORD e CHECK_HOTEL_ID');
  }
  const gatewayKey = env.CHECK_API_KEY ? { 'x-api-key': env.CHECK_API_KEY } : {};
  const bff = base(env.CHECK_BFF_URL);
  const login = await request(`${bff}/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json', ...gatewayKey },
    body: JSON.stringify({ login: env.CHECK_LOGIN, password: env.CHECK_PASSWORD })
  });
  if (!login.body?.token) return record(name, 'FALHA', `login HTTP ${login.status}`);
  const headers = { authorization: `Bearer ${login.body.token}`, 'content-type': 'application/json', ...gatewayKey };
  const call = (method, path, body) => request(`${bff}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const marker = `CHECK-${Date.now()}`;
  const steps = [];
  const expect = (label, response, status) => {
    steps.push(`${label} ${response.status}`);
    if (response.status !== status) throw new Error(`${label}: HTTP ${response.status} (esperado ${status})`);
    return response.body;
  };
  try {
    const room = expect('POST /rooms', await call('POST', '/rooms', { hotelId: env.CHECK_HOTEL_ID, number: marker, roomType: 'STD' }), 201);
    expect('GET /rooms/:id', await call('GET', `/rooms/${room.id}`), 200);
    expect('PUT /rooms/:id', await call('PUT', `/rooms/${room.id}`, { number: marker, roomType: 'DLX' }), 200);
    expect('DELETE /rooms/:id', await call('DELETE', `/rooms/${room.id}`), 204);
    const guest = expect('POST /guests', await call('POST', '/guests', { name: 'Hóspede de verificação', document: marker }), 201);
    expect('GET /guests/:id', await call('GET', `/guests/${guest.id}`), 200);
    expect('PUT /guests/:id', await call('PUT', `/guests/${guest.id}`, { phone: '0000' }), 200);
    expect('DELETE /guests/:id', await call('DELETE', `/guests/${guest.id}`), 204);
    return record(name, 'OK', steps.join(', '));
  } catch (error) {
    return record(name, 'FALHA', `${error.message} | passos: ${steps.join(', ')} | registros com "${marker}" podem ter ficado`);
  }
}

async function checkGateway() {
  const value = env.CHECK_GATEWAY_URL;
  if (!value) return record('API Gateway', 'PENDENTE', 'defina CHECK_GATEWAY_URL (Fase 10)');
  const invalid = validateUrl('CHECK_GATEWAY_URL', value);
  if (invalid) return record('API Gateway', 'FALHA', invalid);
  try {
    const anonymous = await request(`${base(value)}/health`);
    record('Gateway sem chave', [401, 403].includes(anonymous.status) ? 'OK' : 'FALHA', `HTTP ${anonymous.status} (esperado 401 ou 403)`);
    if (!env.CHECK_API_KEY) return record('Gateway com chave', 'PENDENTE', 'defina CHECK_API_KEY');
    const authorized = await request(`${base(value)}/health`, { headers: { 'x-api-key': env.CHECK_API_KEY } });
    return record('Gateway com chave', authorized.status === 200 ? 'OK' : 'FALHA', `HTTP ${authorized.status} (esperado 200)`);
  } catch (error) {
    return record('API Gateway', 'FALHA', error.message);
  }
}

(async () => {
  await checkHealth('BFF', 'CHECK_BFF_URL');
  await checkHealth('Hotel Service', 'CHECK_HOTEL_URL');
  await checkHealth('Reservas Service', 'CHECK_RESERVATIONS_URL');
  await checkAggregatedData();
  await checkFunction();
  await checkGateway();
  await checkCrud();

  for (const { name, status, detail } of results) console.log(`${status.padEnd(9)} ${name.padEnd(44)} ${detail}`);
  const count = status => results.filter(result => result.status === status).length;
  console.log(`\nOK: ${count('OK')} | AVISO: ${count('AVISO')} | PENDENTE: ${count('PENDENTE')} | FALHA: ${count('FALHA')}`);
  process.exitCode = count('FALHA') || (strict && count('PENDENTE')) ? 1 : 0;
})();
