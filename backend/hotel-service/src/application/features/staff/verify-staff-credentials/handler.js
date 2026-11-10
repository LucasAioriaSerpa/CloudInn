const { UnauthorizedError, ValidationError } = require('../../../../domain/errors');
const { assertPort } = require('../../../ports');

// Usado pelo login do BFF. A mensagem de erro é a mesma para usuário inexistente, senha errada
// ou funcionário inativo, para não revelar quais logins existem.
class VerifyStaffCredentialsHandler {
  constructor({ staffRepository, passwordHasher }) {
    this.staffRepository = assertPort('staffRepository', staffRepository, ['findByLogin']);
    this.passwordHasher = assertPort('passwordHasher', passwordHasher, ['compare']);
  }

  async execute({ login, password }) {
    if (typeof login !== 'string' || !login.trim() || typeof password !== 'string' || !password) {
      throw new ValidationError('Os campos login e password são obrigatórios.');
    }
    const staff = await this.staffRepository.findByLogin(login.trim().toLowerCase());
    // compare é chamado mesmo sem funcionário, para que o tempo de resposta não revele se o login existe.
    const passwordMatches = await this.passwordHasher.compare(password, staff?.passwordHash);
    if (!staff || !passwordMatches || !staff.canLogin()) {
      throw new UnauthorizedError('Credenciais inválidas.');
    }
    return staff;
  }
}

module.exports = { VerifyStaffCredentialsHandler };
