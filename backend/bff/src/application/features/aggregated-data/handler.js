class GetAggregatedDataHandler {
  constructor({ gatewayClient, assembler }) {
    this.gatewayClient = gatewayClient;
    this.assembler = assembler;
  }

  async execute(query) {
    if (!query.hotelId || !query.date) {
      const error = new Error('Parâmetros obrigatórios ausentes: hotelId e date são necessários.');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const errors = [];

    // Busca hotel e reservas em paralelo usando Promise.allSettled
    const [hotelResult, reservationsResult] = await Promise.allSettled([
      this.gatewayClient.fetchHotel(query.hotelId, query.correlationId),
      this.gatewayClient.fetchReservations(query.hotelId, query.date, query.correlationId)
    ]);

    const hotel = hotelResult.status === 'fulfilled' ? hotelResult.value : null;
    if (hotelResult.status === 'rejected') {
      errors.push({
        source: 'hotel-service',
        code: 'UPSTREAM_ERROR',
        message: hotelResult.reason?.message || 'Falha ao buscar dados do hotel'
      });
    }

    const reservations = reservationsResult.status === 'fulfilled' ? reservationsResult.value : null;
    if (reservationsResult.status === 'rejected') {
      errors.push({
        source: 'reservations-service',
        code: 'UPSTREAM_ERROR',
        message: reservationsResult.reason?.message || 'Falha ao buscar reservas'
      });
    }

    // Se ambas as fontes downstream principais falharem, responder 503
    if (!hotel && !reservations) {
      const error = new Error('Todas as fontes de dados downstream estão indisponíveis.');
      error.statusCode = 503;
      error.code = 'DOWNSTREAM_UNAVAILABLE';
      throw error;
    }

    let calculations = null;

    if (query.includeCalculations) {
      try {
        calculations = await this.gatewayClient.fetchCalculations({
          hotelId: query.hotelId,
          date: query.date,
          correlationId: query.correlationId
        });
      } catch (analyticsError) {
        errors.push({
          source: 'analytics',
          code: analyticsError.code || 'TIMEOUT',
          message: analyticsError.message || 'Falha ou timeout no cálculo analítico'
        });
      }
    }

    return this.assembler.assemble({
      hotel,
      reservations,
      calculations,
      errors,
      correlationId: query.correlationId
    });
  }
}

module.exports = { GetAggregatedDataHandler };
