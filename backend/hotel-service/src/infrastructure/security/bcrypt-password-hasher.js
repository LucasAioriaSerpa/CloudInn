const bcrypt = require('bcryptjs');

class BcryptPasswordHasher {
  constructor({ rounds = 10 } = {}) {
    this.rounds = rounds;
    // Hash fixo usado quando o login não existe, para manter o mesmo tempo de resposta.
    this.dummyHash = bcrypt.hashSync('cloudinn-login-inexistente', rounds);
  }

  hash(password) {
    return bcrypt.hash(password, this.rounds);
  }

  async compare(password, passwordHash) {
    if (!passwordHash) {
      await bcrypt.compare(password, this.dummyHash);
      return false;
    }
    return bcrypt.compare(password, passwordHash);
  }
}

module.exports = { BcryptPasswordHasher };
