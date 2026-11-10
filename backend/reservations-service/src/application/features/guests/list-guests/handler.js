const { assertPort } = require('../../../ports');

// search: trecho do nome, e-mail ou documento. document: busca exata.
class ListGuestsHandler {
  constructor({ guestRepository }) {
    this.guestRepository = assertPort('guestRepository', guestRepository, ['findAll']);
  }

  execute({ search, document } = {}) {
    return this.guestRepository.findAll({ search: search?.trim() || undefined, document: document?.trim() || undefined });
  }
}

module.exports = { ListGuestsHandler };
