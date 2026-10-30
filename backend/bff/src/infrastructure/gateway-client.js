class GatewayClient {
  constructor({ transport }) {
    this.transport = transport;
  }

  fetchHotel(hotelId) { return this.transport.get(`/hotels/${hotelId}/catalog`); }
  fetchReservations(hotelId, date) { return this.transport.get(`/reservations?hotelId=${hotelId}&date=${date}`); }
  fetchCalculations(payload) { return this.transport.post('/analytics/calculate', payload); }
}

module.exports = { GatewayClient };
