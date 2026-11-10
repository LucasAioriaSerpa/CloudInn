class GetAggregatedDataQuery {
  constructor({ hotelId, date, includeCalculations = true, correlationId }) {
    this.hotelId = hotelId;
    this.date = date;
    this.includeCalculations = includeCalculations;
    this.correlationId = correlationId;
  }
}

module.exports = { GetAggregatedDataQuery };
