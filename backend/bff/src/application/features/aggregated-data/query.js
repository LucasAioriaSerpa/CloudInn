const { ValidationError } = require('../../errors');

const isValidDay = value => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

class GetAggregatedDataQuery {
  constructor({ hotelId, date, includeCalculations = true }) {
    if (typeof hotelId !== 'string' || hotelId.trim() === '') {
      throw new ValidationError('O parâmetro hotelId é obrigatório.');
    }
    if (!isValidDay(date)) {
      throw new ValidationError('O parâmetro date é obrigatório no formato AAAA-MM-DD.');
    }
    this.hotelId = hotelId.trim();
    this.date = date;
    this.includeCalculations = includeCalculations !== false && includeCalculations !== 'false';
  }
}

module.exports = { GetAggregatedDataQuery };
