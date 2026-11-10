const { STAFF_ROLES, STAFF_STATUSES } = require('../../../../domain/staff');
const { ValidationError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

class ListStaffHandler {
  constructor({ staffRepository }) {
    this.staffRepository = assertPort('staffRepository', staffRepository, ['findAll']);
  }

  async execute({ hotelId, role, status, department } = {}) {
    if (role !== undefined && !STAFF_ROLES.includes(role)) {
      throw new ValidationError(`role deve ser um de: ${STAFF_ROLES.join(', ')}.`);
    }
    if (status !== undefined && !STAFF_STATUSES.includes(status)) {
      throw new ValidationError(`status deve ser um de: ${STAFF_STATUSES.join(', ')}.`);
    }
    return this.staffRepository.findAll({ hotelId, role, status, department });
  }
}

module.exports = { ListStaffHandler };
