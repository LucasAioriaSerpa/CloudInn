const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../../application/errors');

const ISSUER = 'cloudinn-bff';
const ALGORITHM = 'HS256';

class JwtTokenService {
  constructor({ secret, expiresIn }) {
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  sign(claims) {
    const token = jwt.sign(claims, this.secret, { algorithm: ALGORITHM, issuer: ISSUER, expiresIn: this.expiresIn });
    const { exp } = jwt.decode(token);
    return { token, expiresAt: new Date(exp * 1000).toISOString() };
  }

  verify(token) {
    try {
      return jwt.verify(token, this.secret, { algorithms: [ALGORITHM], issuer: ISSUER });
    } catch (error) {
      throw new UnauthorizedError(error.name === 'TokenExpiredError' ? 'Sessão expirada; faça login novamente.' : 'Token inválido.');
    }
  }
}

module.exports = { JwtTokenService };
