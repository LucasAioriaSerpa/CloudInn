const { NotFoundError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

class DeleteStaffHandler {
  constructor({ staffRepository }) {
    this.staffRepository = assertPort('staffRepository', staffRepository, ['findById', 'delete']);
  }

  async execute({ staffId }) {
    const staff = await this.staffRepository.findById(staffId);
    if (!staff) throw new NotFoundError('Staff not found');
    await this.staffRepository.delete(staff.id);
  }
}

module.exports = { DeleteStaffHandler };
