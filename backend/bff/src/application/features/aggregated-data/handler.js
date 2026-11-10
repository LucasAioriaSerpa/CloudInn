const { assertPort } = require('../../ports');
const { NotFoundError, UpstreamError } = require('../../errors');
const { buildCalculationInput } = require('./occupancy');

const SOURCES = { hotel: 'hotel-service', reservations: 'reservations-service', guests: 'reservations-service/guests', analytics: 'analytics-function' };

// GET /aggregated-data: consulta Hotel e Reservas em paralelo e, com esses dados, a Function.
// Falha de uma fonte vira resposta parcial (metadata.partial + errors); só falha de todas vira 503.
class GetAggregatedDataHandler {
  constructor({ hotelService, reservationsService, analytics, clock, assembler }) {
    this.hotelService = assertPort('hotelService', hotelService, ['getCatalog']);
    this.reservationsService = assertPort('reservationsService', reservationsService);
    this.analytics = assertPort('analytics', analytics);
    this.clock = assertPort('clock', clock);
    this.assembler = assembler;
  }

  async execute(query, { correlationId } = {}) {
    const context = { correlationId };
    const errors = [];

    const [catalogResult, reservationsResult, guestsResult] = await Promise.allSettled([
      this.hotelService.getCatalog(query.hotelId, context),
      this.reservationsService.listReservations({ hotelId: query.hotelId, date: query.date }, context),
      this.reservationsService.listGuests(context)
    ]);

    // Hotel inexistente não é falha parcial: é 404.
    if (catalogResult.status === 'rejected' && catalogResult.reason instanceof NotFoundError) throw catalogResult.reason;

    const valueOf = (result, source) => {
      if (result.status === 'fulfilled') return result.value;
      if (!(result.reason instanceof UpstreamError)) throw result.reason; // defeito de programação: não esconder
      errors.push({ source, code: result.reason.code, message: result.reason.message });
      return null;
    };
    const catalog = valueOf(catalogResult, SOURCES.hotel);
    const reservations = valueOf(reservationsResult, SOURCES.reservations);
    const guests = valueOf(guestsResult, SOURCES.guests);

    let calculations = null;
    if (query.includeCalculations) {
      calculations = await this.calculate({ query, catalog, reservations, errors, context });
    }

    if (!catalog && !reservations && !guests && !calculations) {
      throw new UpstreamError('bff', 'ALL_SOURCES_UNAVAILABLE', 'Nenhuma fonte de dados respondeu.');
    }

    return this.assembler.assemble({
      catalog, reservations, guests, calculations, errors,
      correlationId, generatedAt: this.clock.now().toISOString()
    });
  }

  async calculate({ query, catalog, reservations, errors, context }) {
    if (!catalog || !reservations) {
      errors.push({ source: SOURCES.analytics, code: 'SKIPPED', message: 'Cálculo não executado: faltam dados do hotel ou das reservas.' });
      return null;
    }
    const input = buildCalculationInput({ hotelId: query.hotelId, date: query.date, catalog, reservations });
    if (input.totalRooms === 0) {
      errors.push({ source: SOURCES.analytics, code: 'SKIPPED', message: 'Cálculo não executado: o hotel não tem quartos cadastrados.' });
      return null;
    }
    try {
      return await this.analytics.calculate(input, context);
    } catch (error) {
      if (!(error instanceof UpstreamError)) throw error;
      errors.push({ source: SOURCES.analytics, code: error.code, message: error.message });
      return null;
    }
  }
}

module.exports = { GetAggregatedDataHandler, SOURCES };
