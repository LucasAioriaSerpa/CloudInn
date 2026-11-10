const { unexpectedResponse } = require('./http-client');

class ReservationsServiceClient {
  constructor({ httpClient }) {
    this.http = httpClient;
  }

  async listReservations({ hotelId, date }, { correlationId } = {}) {
    const response = await this.http.request('GET', '/reservations', { query: { hotelId, date }, correlationId });
    if (response.status === 200) return response.body;
    throw unexpectedResponse(this.http.name, response);
  }

  async listGuests({ correlationId } = {}) {
    const response = await this.http.request('GET', '/guests', { correlationId });
    if (response.status === 200) return response.body;
    throw unexpectedResponse(this.http.name, response);
  }
}

module.exports = { ReservationsServiceClient };
