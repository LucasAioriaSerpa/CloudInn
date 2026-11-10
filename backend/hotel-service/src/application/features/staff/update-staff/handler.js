const { assertPasswordPolicy } = require('../../../../domain/staff');
const { NotFoundError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

class UpdateStaffHandler {
  constructor({ staffRepository, passwordHasher }) {
    this.staffRepository = assertPort('staffRepository', staffRepository, ['findById', 'save']);
    this.passwordHasher = assertPort('passwordHasher', passwordHasher, ['hash']);
  }

  async execute({ staffId, changes: { password, ...changes } }) {
    const staff = await this.staffRepository.findById(staffId);
    if (!staff) throw new NotFoundError('Staff not found');
    staff.update(changes);
    if (password !== undefined) {
      assertPasswordPolicy(password);
      staff.setPasswordHash(await this.passwordHasher.hash(password));
    }
    await this.staffRepository.save(staff);
    return staff;
  }
}

module.exports = { UpdateStaffHandler };
