// Raiz de composição: liga configuração, adaptadores, casos de uso e API.
// Usada pelo main.js e pelos testes com servidores falsos.
const { HttpClient } = require('./infrastructure/http/http-client');
const { HotelServiceClient } = require('./infrastructure/http/hotel-service-client');
const { ReservationsServiceClient } = require('./infrastructure/http/reservations-service-client');
const { AnalyticsClient } = require('./infrastructure/http/analytics-client');
const { ServiceProxy } = require('./infrastructure/http/service-proxy');
const { JwtTokenService } = require('./infrastructure/security/jwt-token-service');
const { systemClock } = require('./infrastructure/system-clock');
const { createHandlers } = require('./application/create-handlers');
const { UpstreamError } = require('./application/errors');
const { createHttpServer } = require('./api/http-server');

// Entrada mínima válida, usada só para saber se a Function responde.
const ANALYTICS_PROBE = { totalRooms: 1, occupiedRooms: 0, roomRevenue: 0 };

function composeBff(config, { logger, clock = systemClock }) {
  const timeoutMs = config.downstreamTimeoutMs;
  const internalHeaders = { 'x-internal-api-key': config.internalApiKey };
  const httpClients = {
    hotel: new HttpClient({ name: 'hotel-service', baseUrl: config.hotelServiceUrl, timeoutMs, headers: internalHeaders }),
    reservations: new HttpClient({ name: 'reservations-service', baseUrl: config.reservationsServiceUrl, timeoutMs, headers: internalHeaders }),
    analytics: new HttpClient({ name: 'analytics-function', baseUrl: config.analyticsFunctionUrl, timeoutMs, headers: { 'x-functions-key': config.analyticsFunctionKey } })
  };

  const tokenService = new JwtTokenService({ secret: config.jwtSecret, expiresIn: config.jwtExpiresIn });
  const analytics = new AnalyticsClient({ httpClient: httpClients.analytics });
  const handlers = createHandlers({
    hotelService: new HotelServiceClient({ httpClient: httpClients.hotel }),
    reservationsService: new ReservationsServiceClient({ httpClient: httpClients.reservations }),
    analytics,
    tokenService,
    clock
  });

  const readiness = name => async context => {
    const response = await httpClients[name].request('GET', '/health/ready', context);
    if (response.status !== 200) throw new UpstreamError(httpClients[name].name, 'NOT_READY', `HTTP ${response.status}`);
  };

  return createHttpServer({
    handlers,
    tokenService,
    proxy: new ServiceProxy({ clients: { hotel: httpClients.hotel, reservations: httpClients.reservations } }),
    logger,
    corsOrigins: config.corsOrigins,
    healthDetails: { transport: 'http' },
    dependencyChecks: {
      'hotel-service': readiness('hotel'),
      'reservations-service': readiness('reservations'),
      'analytics-function': context => analytics.calculate(ANALYTICS_PROBE, context)
    }
  });
}

module.exports = { composeBff };
