const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');

function loadOpenApiSpec() {
  return YAML.parse(fs.readFileSync(path.join(__dirname, 'openapi.yaml'), 'utf8'));
}

module.exports = { loadOpenApiSpec };
