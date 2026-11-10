const { Guest } = require('../../../../domain/guest');
const { ConflictError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

class CreateGuestHandler {
  constructor({ guestRepository, clock }) {
    this.guestRepository = assertPort('guestRepository', guestRepository, ['findByDocument', 'create']);
    this.clock = assertPort('clock', clock);
  }

  async execute(props) {
    const guest = Guest.create(props, this.clock.now());
    if (await this.guestRepository.findByDocument(guest.document)) {
      throw new ConflictError('Já existe um hóspede com este documento.');
    }
    return this.guestRepository.create(guest);
  }
}

module.exports = { CreateGuestHandler };
