class AggregatedDataAssembler {
  assemble({ hotel, reservations, calculations, errors = [], correlationId }) {
    return {
      hotel: hotel || {},
      guests: reservations?.guests || [],
      reservations: reservations?.items || [],
      calculations: calculations || null,
      metadata: {
        partial: Boolean(!calculations || errors.length > 0),
        errors: errors || [],
        correlationId: correlationId || 'none',
        generatedAt: new Date().toISOString()
      }
    };
  }
}

module.exports = { AggregatedDataAssembler };
