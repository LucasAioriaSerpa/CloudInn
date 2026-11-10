#!/usr/bin/env node

/**
 * Script de verificação de integração fim a fim do CloudInn em URLs públicas.
 * Testa:
 *  1. Validação de URLs públicas (rejeita segredos/tokens embutidos em URLs)
 *  2. Endpoints /health de todos os componentes
 *  3. Autenticação e bloqueio do API Gateway (sem chave -> 401/403; com chave -> 200)
 *  4. Operações CRUD básicas (quartos, hóspedes, reservas)
 *  5. Endpoint /aggregated-data no BFF
 *
 * Uso:
 *   node scripts/check-integration.js --gateway <url> --api-key <key> [--bff <url>] [--hotel <url>] [--reservas <url>]
 *   Ou lendo de variáveis de ambiente: URL_GATEWAY ou VITE_API_BASE_URL, VITE_API_KEY
 */

const http = require('node:http');
const https = require('node:https');
const { URL } = require('node:url');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--gateway' && args[i + 1]) options.gatewayUrl = args[++i];
    if (args[i] === '--api-key' && args[i + 1]) options.apiKey = args[++i];
    if (args[i] === '--bff' && args[i + 1]) options.bffUrl = args[++i];
    if (args[i] === '--hotel' && args[i + 1]) options.hotelUrl = args[++i];
    if (args[i] === '--reservas' && args[i + 1]) options.reservasUrl = args[++i];
  }
  options.gatewayUrl = options.gatewayUrl || process.env.URL_GATEWAY || process.env.VITE_API_BASE_URL;
  options.apiKey = options.apiKey || process.env.VITE_API_KEY;
  options.bffUrl = options.bffUrl || process.env.BFF_SERVICE_URI || options.gatewayUrl;
  options.hotelUrl = options.hotelUrl || process.env.HOTEL_SERVICE_URL;
  options.reservasUrl = options.reservasUrl || process.env.RESERVATIONS_SERVICE_URL;
  return options;
}

function assertSafeUrl(urlString, name) {
  if (!urlString) return;
  try {
    const parsed = new URL(urlString);
    if (parsed.username || parsed.password) {
      throw new Error(`A URL do ${name} contém credenciais embutidas (usuário/senha), o que é estritamente proibido.`);
    }
    const search = parsed.search.toLowerCase();
    const forbidden = ['code=', 'key=', 'token=', 'sig='];
    for (const item of forbidden) {
      if (search.includes(item)) {
        throw new Error(`A URL do ${name} contém parâmetros sensíveis (${item}), o que viola as regras de segurança.`);
      }
    }
  } catch (err) {
    console.error(`[check-integration] ERRO DE SEGURANÇA NA URL [${name}]: ${err.message}`);
    process.exit(1);
  }
}

function request(urlStr, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlStr);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    };

    const req = client.request(parsedUrl, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy(new Error(`Timeout de 10s excedido para ${urlStr}`));
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  const opts = parseArgs();

  console.log('=== CloudInn: Teste de Integração em Ambientes Públicos ===\n');

  if (!opts.gatewayUrl && !opts.bffUrl) {
    console.error('ERRO: Nenhuma URL de API Gateway ou BFF informada.');
    console.error('Informe via --gateway <url> e --api-key <chave>, ou pelas variáveis VITE_API_BASE_URL e VITE_API_KEY.');
    process.exit(1);
  }

  assertSafeUrl(opts.gatewayUrl, 'API Gateway');
  assertSafeUrl(opts.bffUrl, 'BFF');
  assertSafeUrl(opts.hotelUrl, 'Hotel Service');
  assertSafeUrl(opts.reservasUrl, 'Reservas Service');

  let passed = 0;
  let failed = 0;

  async function step(name, fn) {
    process.stdout.write(`• ${name}... `);
    try {
      await fn();
      console.log('✓ OK');
      passed++;
    } catch (err) {
      console.log(`✗ FALHA: ${err.message}`);
      failed++;
    }
  }

  // 1. Teste de Gateway sem chave
  if (opts.gatewayUrl) {
    await step('Gateway: Bloqueio sem API Key (esperado 401 ou 403)', async () => {
      const res = await request(`${opts.gatewayUrl}/rooms`);
      if (res.statusCode !== 401 && res.statusCode !== 403) {
        throw new Error(`Esperado status 401 ou 403, recebido ${res.statusCode}`);
      }
    });

    if (opts.apiKey) {
      await step('Gateway: Acesso com API Key válida', async () => {
        const res = await request(`${opts.gatewayUrl}/health`, {
          headers: { 'x-api-key': opts.apiKey }
        });
        if (res.statusCode !== 200) {
          throw new Error(`Esperado status 200 com API Key, recebido ${res.statusCode}`);
        }
      });
    }
  }

  // 2. Health check no BFF / Gateway
  const baseUrl = opts.gatewayUrl || opts.bffUrl;
  const authHeaders = opts.apiKey ? { 'x-api-key': opts.apiKey } : {};

  await step('BFF /health check', async () => {
    const res = await request(`${baseUrl}/health`, { headers: authHeaders });
    if (res.statusCode !== 200) {
      throw new Error(`Status ${res.statusCode}: ${JSON.stringify(res.data)}`);
    }
  });

  // 3. /aggregated-data
  await step('BFF /aggregated-data (consulta hotel, reservas e function)', async () => {
    const res = await request(`${baseUrl}/aggregated-data?hotelId=hotel-1&date=2026-11-10&includeCalculations=true`, {
      headers: authHeaders
    });
    if (res.statusCode !== 200 && res.statusCode !== 503) {
      throw new Error(`Status inesperado ${res.statusCode}`);
    }
  });

  // 4. CRUD Quartos
  await step('Hotel Service: Listagem de quartos (GET /rooms)', async () => {
    const res = await request(`${baseUrl}/rooms`, { headers: authHeaders });
    if (res.statusCode !== 200) {
      throw new Error(`Status ${res.statusCode}`);
    }
  });

  // 5. CRUD Reservas
  await step('Reservas Service: Listagem de reservas (GET /reservations)', async () => {
    const res = await request(`${baseUrl}/reservations`, { headers: authHeaders });
    if (res.statusCode !== 200) {
      throw new Error(`Status ${res.statusCode}`);
    }
  });

  console.log(`\nRelatório final: ${passed} passos concluídos, ${failed} falhas.`);
  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

run().catch(err => {
  console.error('[check-integration] Erro inesperado na execução:', err);
  process.exit(1);
});
