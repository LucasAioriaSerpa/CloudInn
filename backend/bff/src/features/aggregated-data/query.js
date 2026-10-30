class GetAggregatedDataQuery {
  constructor({ hotelId, date, includeCalculations = true }) {
    this.hotelId = hotelId;
    this.date = date;
    this.includeCalculations = includeCalculations;
  }
}

module.exports = { GetAggregatedDataQuery };
