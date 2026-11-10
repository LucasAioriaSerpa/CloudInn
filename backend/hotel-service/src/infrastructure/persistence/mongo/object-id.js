const { ObjectId } = require('mongodb');
const { ConflictError } = require('../../../domain/errors');

// IDs públicos são o ObjectId em hexadecimal. Formato inválido equivale a "não encontrado".
function toObjectId(id) {
  return typeof id === 'string' && /^[0-9a-f]{24}$/i.test(id) ? new ObjectId(id) : null;
}

function translateWriteError(error, conflictMessage) {
  if (error?.code === 11000) return new ConflictError(conflictMessage);
  return error;
}

module.exports = { toObjectId, translateWriteError };
