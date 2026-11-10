// Campos conforme o modelo MongoDB do arc42 (coleção hotels). Somente leitura neste serviço:
// os hotéis são cadastrados pelo seed; o contrato HTTP expõe apenas o catálogo.
class Hotel {
  constructor({ id, code, name, cnpj, address, phone, email, checkInOutPolicies, createdAt }) {
    Object.assign(this, { id, code, name, cnpj, address, phone, email, checkInOutPolicies, createdAt });
  }
}

module.exports = { Hotel };
