const fs = require('node:fs');

// Lê um arquivo KEY=VALUE sem alterar process.env e sem executar nada.
function parseEnvFile(file) {
  const values = {};
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    values[key] = value;
  }
  return values;
}

// Valores vazios ou no formato <preencher> contam como ausentes.
function withoutPlaceholders(values) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '' && !/^<.*>$/.test(value)));
}

module.exports = { parseEnvFile, withoutPlaceholders };
