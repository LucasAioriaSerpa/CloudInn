#!/usr/bin/env node

/**
 * Validador de configurações e variáveis de ambiente do CloudInn.
 * Regra estrita: Nunca imprime valores ou segredos em logs, apenas os nomes das chaves.
 * Uso:
 *   node scripts/check-config.js [componente]
 *   Componentes: bff | hotel-service | reservations-service | frontend | all (padrão)
 */

const fs = require('node:fs');
const path = require('node:path');

// Carrega variáveis de ambiente de .env local se existir
const envFiles = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local')
];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    try {
      if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile(envFile);
      }
    } catch {
      // Ignora erro de parsing nativo se já carregado
    }
  }
}

const REQUIRED_CONFIGS = {
  bff: [
    'HOTEL_SERVICE_URL',
    'RESERVATIONS_SERVICE_URL',
    'INTERNAL_API_KEY',
    'JWT_SECRET'
  ],
  'hotel-service': [
    'MONGODB_URI',
    'MONGODB_DB_NAME',
    'INTERNAL_API_KEY',
    'SERVICEBUS_CONNECTION',
    'EVENT_PUBLISHER'
  ],
  'reservations-service': [
    'AZURE_SQL_CONNECTION_STRING',
    'INTERNAL_API_KEY',
    'SERVICEBUS_CONNECTION',
    'EVENT_PUBLISHER'
  ],
  frontend: [
    'VITE_API_BASE_URL'
  ]
};

const OPTIONAL_CONFIGS = {
  bff: ['PORT', 'ANALYTICS_FUNCTION_URL', 'ANALYTICS_FUNCTION_KEY', 'CORS_ORIGINS', 'DOWNSTREAM_TIMEOUT_MS'],
  'hotel-service': ['PORT', 'SEED_STAFF_PASSWORD'],
  'reservations-service': ['PORT'],
  frontend: ['VITE_API_KEY', 'VITE_ENABLE_MOCK']
};

const target = process.argv[2] || 'all';

console.log(`[check-config] Verificando variáveis de ambiente para o alvo: "${target}"...`);

let hasErrors = false;
const componentsToCheck = target === 'all'
  ? Object.keys(REQUIRED_CONFIGS)
  : [target];

for (const component of componentsToCheck) {
  const required = REQUIRED_CONFIGS[component];
  if (!required) {
    console.error(`[check-config] ERRO: Componente desconhecido "${component}". Use: bff, hotel-service, reservations-service, frontend, ou all.`);
    process.exit(1);
  }

  const missing = required.filter(key => {
    const val = process.env[key];
    return val === undefined || val === null || String(val).trim() === '';
  });

  const present = required.filter(key => {
    const val = process.env[key];
    return val !== undefined && val !== null && String(val).trim() !== '';
  });

  console.log(`\nComponente: [${component}]`);
  console.log(`  ✓ Presentes (${present.length}/${required.length}): ${present.join(', ') || '(nenhuma)'}`);

  if (missing.length > 0) {
    hasErrors = true;
    console.error(`  ✗ AUSENTES (${missing.length}): ${missing.join(', ')}`);
  } else {
    console.log(`  ✓ Todas as variáveis obrigatórias estão configuradas.`);
  }

  // Validação adicional de EVENT_PUBLISHER em produção
  if (component === 'hotel-service' || component === 'reservations-service') {
    if (process.env.NODE_ENV === 'production' && process.env.EVENT_PUBLISHER === 'log') {
      hasErrors = true;
      console.error(`  ✗ ERRO: EVENT_PUBLISHER=log é proibido em NODE_ENV=production. Use EVENT_PUBLISHER=servicebus.`);
    }
  }
}

console.log('\n-------------------------------------------------------------');
if (hasErrors) {
  console.error('[check-config] FALHA: Há variáveis obrigatórias ausentes ou inválidas.');
  console.error('Consulte os arquivos .env.example correspondentes para preencher os valores no cofre ou no .env local.');
  process.exit(1);
} else {
  console.log('[check-config] SUCESSO: Todas as variáveis necessárias estão configuradas corretamente.');
  process.exit(0);
}
