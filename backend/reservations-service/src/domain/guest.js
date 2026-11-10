const { ValidationError } = require('./errors');

// Campos conforme o ERD do arc42 (tabela Guests) e o schema Guest do DOC/api/swagger.yaml.
function requireText(value, field, maxLength) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`O campo ${field} é obrigatório.`);
  }
  return limit(value.trim(), field, maxLength);
}

function limit(value, field, maxLength) {
  if (value !== undefined && value !== null && value.length > maxLength) {
    throw new ValidationError(`O campo ${field} aceita no máximo ${maxLength} caracteres.`);
  }
  return value;
}

class Guest {
  // O construtor apenas reidrata dados já persistidos; use Guest.create para novos hóspedes.
  constructor({ id, name, document, email = null, phone = null, vip = false, createdAt, updatedAt }) {
    Object.assign(this, { id, name, document, email, phone, vip, createdAt, updatedAt });
  }

  static create(props, now = new Date()) {
    const guest = new Guest({ createdAt: now, updatedAt: now });
    guest.apply({ vip: false, ...props }, true);
    return guest;
  }

  update(changes, now = new Date()) {
    this.apply(changes, false);
    this.updatedAt = now;
  }

  apply(changes, creating) {
    if (creating || changes.name !== undefined) this.name = requireText(changes.name, 'name', 150);
    if (creating || changes.document !== undefined) this.document = requireText(changes.document, 'document', 30);
    if (changes.email !== undefined) this.email = changes.email === null ? null : limit(changes.email.trim().toLowerCase(), 'email', 120);
    if (changes.phone !== undefined) this.phone = changes.phone === null ? null : limit(changes.phone.trim(), 'phone', 25);
    if (changes.vip !== undefined) this.vip = Boolean(changes.vip);
  }
}

module.exports = { Guest };
