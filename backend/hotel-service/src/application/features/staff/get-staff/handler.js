const { NotFoundError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

class GetStaffHandler {
  constructor({ staffRepository }) {
    this.staffRepository = assertPort('staffRepository', staffRepository, ['findById']);
  }

  async execute({ staffId }) {
    const staff = await this.staffRepository.findById(staffId);
    if (!staff) throw new NotFoundError('Staff not found');
    return staff;
  }
}

module.exports = { GetStaffHandler };
