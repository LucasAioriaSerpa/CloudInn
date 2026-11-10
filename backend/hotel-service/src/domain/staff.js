const { ValidationError } = require('./errors');

// Papéis e status conforme DOC/api/swagger.yaml (schema Staff).
const STAFF_ROLES = ['manager', 'sub_manager', 'receptionist', 'housekeeper'];
const STAFF_STATUSES = ['active', 'inactive', 'on_leave'];
const OPTIONAL_TEXT_FIELDS = ['email', 'roleLabel', 'department', 'shift', 'phone', 'document', 'avatar', 'color'];
const MIN_PASSWORD_LENGTH = 8;

function requireText(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`O campo ${field} é obrigatório.`);
  }
  return value.trim();
}

function assertPasswordPolicy(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }
}

class Staff {
  // O construtor apenas reidrata dados já persistidos; use Staff.create para novos funcionários.
  constructor(props) {
    const { id, hotelId, name, username, role, status = 'active', passwordHash, createdAt, updatedAt } = props;
    Object.assign(this, { id, hotelId, name, username, role, status, createdAt, updatedAt });
    for (const field of OPTIONAL_TEXT_FIELDS) {
      if (props[field] !== undefined && props[field] !== null) this[field] = props[field];
    }
    // Não enumerável: nunca aparece em JSON.stringify nem em respostas.
    Object.defineProperty(this, 'passwordHash', { value: passwordHash, writable: true, enumerable: false });
  }

  static create(props, passwordHash, now = new Date()) {
    const staff = new Staff({
      ...props,
      hotelId: requireText(props.hotelId, 'hotelId'),
      name: requireText(props.name, 'name'),
      username: requireText(props.username, 'username').toLowerCase(),
      email: props.email?.trim().toLowerCase(),
      status: props.status ?? 'active',
      passwordHash,
      createdAt: now,
      updatedAt: now
    });
    staff.validate();
    return staff;
  }

  update(changes, now = new Date()) {
    if (changes.name !== undefined) this.name = requireText(changes.name, 'name');
    if (changes.username !== undefined) this.username = requireText(changes.username, 'username').toLowerCase();
    if (changes.role !== undefined) this.role = changes.role;
    if (changes.status !== undefined) this.status = changes.status;
    for (const field of OPTIONAL_TEXT_FIELDS) {
      if (changes[field] !== undefined) this[field] = field === 'email' ? changes.email?.trim().toLowerCase() : changes[field];
    }
    this.validate();
    this.updatedAt = now;
  }

  setPasswordHash(passwordHash, now = new Date()) {
    this.passwordHash = passwordHash;
    this.updatedAt = now;
  }

  canLogin() {
    return this.status === 'active' && Boolean(this.passwordHash);
  }

  validate() {
    if (!STAFF_ROLES.includes(this.role)) {
      throw new ValidationError(`role deve ser um de: ${STAFF_ROLES.join(', ')}.`);
    }
    if (!STAFF_STATUSES.includes(this.status)) {
      throw new ValidationError(`status deve ser um de: ${STAFF_STATUSES.join(', ')}.`);
    }
  }
}

module.exports = { Staff, STAFF_ROLES, STAFF_STATUSES, OPTIONAL_TEXT_FIELDS, assertPasswordPolicy };
