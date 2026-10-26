class DateRange {
  constructor(startDate, endDate) {
    if (!startDate || !endDate || new Date(endDate) <= new Date(startDate)) {
      throw new Error('Checkout must be after check-in');
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
