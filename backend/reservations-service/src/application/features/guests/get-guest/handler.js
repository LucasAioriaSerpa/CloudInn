const { NotFoundError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

class GetGuestHandler {
  constructor({ guestRepository }) {
    this.guestRepository = assertPort('guestRepository', guestRepository, ['findById']);
  }

  async execute({ guestId }) {
    const guest = await this.guestRepository.findById(guestId);
    if (!guest) throw new NotFoundError('Hóspede não encontrado.');
    return guest;
  }
}

module.exports = { GetGuestHandler };
