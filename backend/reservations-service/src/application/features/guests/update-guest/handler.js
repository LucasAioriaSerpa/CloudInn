const { ConflictError, NotFoundError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

class UpdateGuestHandler {
  constructor({ guestRepository, clock }) {
    this.guestRepository = assertPort('guestRepository', guestRepository, ['findById', 'findByDocument', 'save']);
    this.clock = assertPort('clock', clock);
  }

  async execute({ guestId, changes }) {
    const guest = await this.guestRepository.findById(guestId);
    if (!guest) throw new NotFoundError('Hóspede não encontrado.');
    guest.update(changes, this.clock.now());
    const sameDocument = await this.guestRepository.findByDocument(guest.document);
    if (sameDocument && sameDocument.id !== guest.id) {
      throw new ConflictError('Já existe um hóspede com este documento.');
    }
    await this.guestRepository.save(guest);
    return guest;
  }
}

module.exports = { UpdateGuestHandler };
