const { ConflictError, NotFoundError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

class DeleteGuestHandler {
  constructor({ guestRepository }) {
    this.guestRepository = assertPort('guestRepository', guestRepository, ['findById', 'hasReservations', 'delete']);
  }

  async execute({ guestId }) {
    const guest = await this.guestRepository.findById(guestId);
    if (!guest) throw new NotFoundError('Hóspede não encontrado.');
    if (await this.guestRepository.hasReservations(guest.id)) {
      throw new ConflictError('Hóspede com reservas não pode ser excluído.');
    }
    await this.guestRepository.delete(guest.id);
  }
}

module.exports = { DeleteGuestHandler };
