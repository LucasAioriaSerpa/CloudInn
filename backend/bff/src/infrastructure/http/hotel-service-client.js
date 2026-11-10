const { NotFoundError, UnauthorizedError, ValidationError } = require('../../application/errors');
const { unexpectedResponse } = require('./http-client');

class HotelServiceClient {
  constructor({ httpClient }) {
    this.http = httpClient;
  }

  async getCatalog(hotelId, { correlationId } = {}) {
    const response = await this.http.request('GET', `/hotels/${encodeURIComponent(hotelId)}/catalog`, { correlationId });
    if (response.status === 200) return response.body;
    if (response.status === 404) throw new NotFoundError('Hotel não encontrado.');
    throw unexpectedResponse(this.http.name, response);
  }

  async verifyCredentials({ login, password }, { correlationId } = {}) {
    const response = await this.http.request('POST', '/staff/verify-credentials', { body: { login, password }, correlationId });
    if (response.status === 200) return response.body;
    if (response.status === 401) throw new UnauthorizedError('Credenciais inválidas.');
    if (response.status === 400) throw new ValidationError(response.body?.error?.message || 'Dados de login inválidos.');
    throw unexpectedResponse(this.http.name, response);
  }
}

module.exports = { HotelServiceClient };
