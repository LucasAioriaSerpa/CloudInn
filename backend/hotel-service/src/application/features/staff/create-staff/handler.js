const { Staff, assertPasswordPolicy } = require('../../../../domain/staff');
const { ValidationError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

class CreateStaffHandler {
  constructor({ staffRepository, hotelRepository, passwordHasher }) {
    this.staffRepository = assertPort('staffRepository', staffRepository, ['create']);
    this.hotelRepository = assertPort('hotelRepository', hotelRepository);
    this.passwordHasher = assertPort('passwordHasher', passwordHasher, ['hash']);
  }

  async execute({ password, ...props }) {
    assertPasswordPolicy(password);
    const staff = Staff.create(props, undefined);
    if (!(await this.hotelRepository.findById(staff.hotelId))) {
      throw new ValidationError('hotelId não corresponde a um hotel cadastrado.');
    }
    staff.setPasswordHash(await this.passwordHasher.hash(password), staff.createdAt);
    return this.staffRepository.create(staff);
  }
}

module.exports = { CreateStaffHandler };
