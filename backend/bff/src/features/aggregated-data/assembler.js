class AggregatedDataAssembler {
  assemble({ hotel, reservations, calculations }) {
    return {
      hotel,
      guests: reservations.guests || [],
      reservations: reservations.items || [],
      calculations,
      metadata: { partial: !calculations, errors: [] }
    };
  }
}

module.exports = { AggregatedDataAssembler };
