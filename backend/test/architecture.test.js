const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Teste nativo de dependências entre camadas. Será complementado por dependency-cruiser na Fase 9.
const backendRoot = path.resolve(__dirname, '..');
const services = ['bff', 'hotel-service', 'reservations-service'];
const sourceFiles = directory => (fs.existsSync(directory) ? fs.readdirSync(directory, { withFileTypes: true }) : []).flatMap(entry => {
  const fullPath = path.join(directory, entry.name);
  if (entry.isDirectory()) return sourceFiles(fullPath);
  return fullPath.endsWith('.js') ? [fullPath] : [];
});

const importsOf = file => [...fs.readFileSync(file, 'utf8').matchAll(/require\(['"](\.\.?\/[^'"]+)['"]\)/g)].map(match => match[1]);

test('ArchiUnitTS: cada service mantém domínio e aplicação sem dependência de infraestrutura ou API', () => {
  for (const service of services) {
    const src = path.join(backendRoot, service, 'src');
    for (const file of sourceFiles(src)) {
      const relative = path.relative(src, file).replaceAll(path.sep, '/');
      if (!relative.startsWith('domain/') && !relative.startsWith('application/')) continue;
      for (const imported of importsOf(file)) {
        assert.ok(!imported.includes('/infrastructure/'), `${service}/${relative} viola Clean Architecture: ${imported}`);
        assert.ok(!imported.includes('/api/'), `${service}/${relative} não pode depender da camada de API: ${imported}`);
        if (relative.startsWith('domain/')) {
          assert.ok(!imported.includes('application/'), `${service}/${relative}: domínio não pode depender da aplicação: ${imported}`);
        }
      }
    }
  }
});

test('ArchiUnitTS: casos de uso ficam em fatias verticais e não importam HTTP', () => {
  for (const service of services) {
    const features = path.join(backendRoot, service, 'src', 'application', 'features');
    assert.ok(fs.existsSync(features), `${service} deve ter src/application/features`);
    for (const file of sourceFiles(features)) {
      const relative = path.relative(features, file).replaceAll(path.sep, '/');
      assert.ok(relative.includes('/'), `${service}/${relative} deve estar dentro de uma fatia vertical`);
      assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /express|http\.createServer|req\.|res\./, `${service}/${relative} mistura transporte com aplicação`);
    }
  }
});

test('Cada service separa as camadas domain/application/infrastructure/api', () => {
  const expected = { bff: ['application', 'infrastructure', 'api'], 'hotel-service': ['domain', 'application', 'infrastructure', 'api'], 'reservations-service': ['domain', 'application', 'infrastructure', 'api'] };
  for (const [service, layers] of Object.entries(expected)) {
    for (const layer of layers) {
      assert.ok(fs.existsSync(path.join(backendRoot, service, 'src', layer)), `${service} sem a camada ${layer}`);
    }
  }
});
