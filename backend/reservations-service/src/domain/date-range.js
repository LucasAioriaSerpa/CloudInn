const { ValidationError } = require('./errors');

const toTime = value => (value ? new Date(value).getTime() : Number.NaN);

class DateRange {
  constructor(startDate, endDate) {
    const start = toTime(startDate);
    const end = toTime(endDate);
    if (Number.isNaN(start) || Number.isNaN(end)) {
      throw new ValidationError('Datas de check-in e check-out devem ser válidas.');
    }
    if (end <= start) {
      throw new ValidationError('Checkout must be after check-in');
    }
    this.startDate = startDate;
    this.endDate = endDate;
  }

  overlaps(other) {
    return new Date(this.startDate) < new Date(other.endDate)
      && new Date(other.startDate) < new Date(this.endDate);
  }
}

module.exports = { DateRange };
