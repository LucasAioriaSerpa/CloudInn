class GetAggregatedDataHandler {
  constructor({ gatewayClient, assembler }) {
    this.gatewayClient = gatewayClient;
    this.assembler = assembler;
  }

  async execute(query) {
    const [hotel, reservations, calculations] = await Promise.all([
      this.gatewayClient.fetchHotel(query.hotelId),
      this.gatewayClient.fetchReservations(query.hotelId, query.date),
      query.includeCalculations
        ? this.gatewayClient.fetchCalculations({ hotelId: query.hotelId, date: query.date })
        : Promise.resolve(null)
    ]);

    return this.assembler.assemble({ hotel, reservations, calculations });
  }
}

module.exports = { GetAggregatedDataHandler };
