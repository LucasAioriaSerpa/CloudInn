const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const backendRoot = path.resolve(__dirname, '..');
const services = ['bff', 'hotel-service', 'reservations-service'];
const sourceFiles = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const fullPath = path.join(directory, entry.name);
  if (entry.isDirectory()) return sourceFiles(fullPath);
  return fullPath.endsWith('.js') ? [fullPath] : [];
});

const importsOf = file => [...fs.readFileSync(file, 'utf8').matchAll(/require\(['"](\.\.?\/[^'"]+)['"]\)/g)].map(match => match[1]);

test('ArchiUnitTS: cada service mantém domínio e features sem dependência de infraestrutura', () => {
  for (const service of services) {
    const src = path.join(backendRoot, service, 'src');
    for (const file of sourceFiles(src)) {
      const relative = path.relative(src, file).replaceAll(path.sep, '/');
      if (!relative.startsWith('domain/') && !relative.startsWith('features/')) continue;
      for (const imported of importsOf(file)) {
        assert.ok(!imported.includes('/infrastructure/'), `${service}/${relative} viola Clean Architecture: ${imported}`);
      }
    }
  }
});

test('ArchiUnitTS: casos de uso ficam em fatias verticais e não importam HTTP', () => {
  for (const service of services) {
    const features = path.join(backendRoot, service, 'src', 'features');
    for (const file of sourceFiles(features)) {
      const relative = path.relative(features, file).replaceAll(path.sep, '/');
      assert.ok(relative.includes('/'), `${service}/${relative} deve estar dentro de uma fatia vertical`);
      assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /express|http\.createServer|req\.|res\./, `${service}/${relative} mistura transporte com aplicação`);
    }
  }
});
