#!/usr/bin/env node
// Confere as variáveis de ambiente de cada componente SEM imprimir valores.
//
// Uso:
//   npm run check:config                          (todos os componentes)
//   npm run check:config -- bff hotel-service     (só os indicados)
//   npm run check:config -- --production          (valida como NODE_ENV=production)
//
// Fonte dos valores: o arquivo .env da pasta do componente, quando existir, somado às variáveis do ambiente.
const fs = require('node:fs');
const path = require('node:path');
const { parseEnvFile, withoutPlaceholders } = require('./lib/env-file');

const root = path.resolve(__dirname, '..');
const SERVICES = {
  bff: 'backend/bff',
  'hotel-service': 'backend/hotel-service',
  'reservations-service': 'backend/reservations-service'
};
const FUNCTION_DIR = 'backend/api/functions/analytics-function';
const FUNCTION_REQUIRED = ['FUNCTIONS_WORKER_RUNTIME', 'AzureWebJobsStorage', 'SERVICEBUS_CONNECTION'];

const args = process.argv.slice(2);
const production = args.includes('--production');
const requested = args.filter(arg => !arg.startsWith('--'));
const components = requested.length ? requested : [...Object.keys(SERVICES), 'analytics-function', 'frontend'];

let failures = 0;
const report = (component, status, detail) => {
  if (status === 'FALHA') failures += 1;
  console.log(`${status.padEnd(7)} ${component.padEnd(22)} ${detail}`);
};

function checkService(name) {
  const dir = path.join(root, SERVICES[name]);
  const envFile = path.join(dir, '.env');
  const fileValues = fs.existsSync(envFile) ? parseEnvFile(envFile) : {};
  const env = withoutPlaceholders({ ...process.env, ...fileValues });
  if (production) env.NODE_ENV = 'production';
  const source = fs.existsSync(envFile) ? 'arquivo .env + ambiente' : 'somente variáveis do ambiente';

  const { loadConfig, ConfigError } = require(path.join(dir, 'src', 'config.js'));
  try {
    loadConfig(env);
    report(name, 'OK', `(${source})`);
  } catch (error) {
    if (!(error instanceof ConfigError)) throw error;
    const parts = [];
    if (error.missing.length) parts.push(`ausentes: ${error.missing.join(', ')}`);
    if (error.invalid.length) parts.push(`inválidas: ${error.invalid.join(', ')}`);
    report(name, 'FALHA', `${parts.join(' | ')} (${source})`);
  }
}

function checkFunction() {
  const settingsFile = path.join(root, FUNCTION_DIR, 'local.settings.json');
  if (!fs.existsSync(settingsFile)) {
    report('analytics-function', 'AVISO', 'local.settings.json não existe (só é necessário para rodar a Function na sua máquina; na nuvem, confira as App settings da Function App).');
    return;
  }
  let values;
  try {
    values = withoutPlaceholders(JSON.parse(fs.readFileSync(settingsFile, 'utf8')).Values || {});
  } catch {
    report('analytics-function', 'FALHA', 'local.settings.json não é um JSON válido.');
    return;
  }
  const missing = FUNCTION_REQUIRED.filter(key => !values[key]);
  if (missing.length) report('analytics-function', 'FALHA', `ausentes: ${missing.join(', ')}`);
  else report('analytics-function', 'OK', '(local.settings.json)');
}

for (const component of components) {
  if (SERVICES[component]) checkService(component);
  else if (component === 'analytics-function') checkFunction();
  else if (component === 'frontend') report('frontend', 'OK', 'nenhuma variável obrigatória até a Fase 7.');
  else report(component, 'FALHA', `componente desconhecido. Use: ${[...Object.keys(SERVICES), 'analytics-function', 'frontend'].join(', ')}`);
}

process.exitCode = failures ? 1 : 0;
