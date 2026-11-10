const { ConflictError } = require('../../domain/errors');
const { errorNumber } = require('./connection');

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isGuid = value => typeof value === 'string' && GUID.test(value);
const lowerGuid = value => (value ? String(value).toLowerCase() : value);

// Coluna DATE recebida como 'YYYY-MM-DD', sem conversão de fuso.
const toSqlDate = day => new Date(`${day}T00:00:00Z`);

// 2601/2627 = chave única violada; 547 = chave estrangeira.
function translateSqlError(error, { duplicate, foreignKey } = {}) {
  const number = errorNumber(error);
  if ((number === 2601 || number === 2627) && duplicate) return new ConflictError(duplicate);
  if (number === 547 && foreignKey) return foreignKey;
  return error;
}

module.exports = { isGuid, lowerGuid, toSqlDate, translateSqlError };
