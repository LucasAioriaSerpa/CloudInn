const { assertPort } = require('../../../ports');
const { ValidationError } = require('../../../errors');

// Valida as credenciais no Hotel Service (dono do staff) e emite um JWT do BFF.
class LoginHandler {
  constructor({ hotelService, tokenService }) {
    this.hotelService = assertPort('hotelService', hotelService, ['verifyCredentials']);
    this.tokenService = assertPort('tokenService', tokenService, ['sign']);
  }

  async execute({ login, password }, { correlationId } = {}) {
    if (typeof login !== 'string' || !login.trim() || typeof password !== 'string' || !password) {
      throw new ValidationError('Os campos login e password são obrigatórios.');
    }
    const staff = await this.hotelService.verifyCredentials({ login: login.trim(), password }, { correlationId });
    const { token, expiresAt } = this.tokenService.sign({
      sub: staff.id,
      username: staff.username,
      name: staff.name,
      role: staff.role,
      hotelId: staff.hotelId
    });
    return { token, tokenType: 'Bearer', expiresAt, user: staff };
  }
}

module.exports = { LoginHandler };
