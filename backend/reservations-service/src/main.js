require('dotenv').config();

const http = require('node:http');

const { getConnection, closeConnection } =
  require('./infrastructure/sql/connection');

const { SqlUnitOfWork } =
  require('./infrastructure/sql/unit-of-work');

const { SqlReservationRepository } =
  require('./infrastructure/sql/reservation-repository');

const { SqlIdempotencyRepository } =
  require('./infrastructure/sql/idempotency-repository');

const { CreateReservationHandler } =
  require('./features/reservations/create-reservation/handler');

const handler = new CreateReservationHandler({
  reservationRepository: new SqlReservationRepository(),
  idempotencyRepository: new SqlIdempotencyRepository(),
  unitOfWork: new SqlUnitOfWork()
});

const server = http.createServer(async (request, response) => {
  response.setHeader('Content-Type', 'application/json');

  const path = request.url.split('?')[0];

  if (request.method === 'GET' && path === '/health') {
    response.statusCode = 200;

    return response.end(JSON.stringify({
      status: 'ok',
      service: 'reservations-service'
    }));
  }

  if (request.method === 'POST' && path === '/reservations') {
    let body = '';

    try {
      for await (const chunk of request) {
        body += chunk;
      }

      const command = JSON.parse(body);

      const result = await handler.execute(command);

      response.statusCode = 201;
      return response.end(JSON.stringify(result));

    } catch (error) {
      console.error('Erro ao criar reserva:', error);

      response.statusCode = error.statusCode || 500;

      return response.end(JSON.stringify({
        error: error.statusCode ? error.message : 'Erro interno ao criar reserva.'
      }));
    }
  }

  response.statusCode = 404;

  return response.end(JSON.stringify({
    error: 'Not found'
  }));
});

async function startServer() {
  try {
    await getConnection();

    const port = process.env.PORT || 5002;

    server.listen(port, '0.0.0.0', () => {
      console.log(`Reservations Service rodando na porta ${port}`);
    });

  } catch (error) {
    console.error('Não foi possível iniciar o serviço:', error);
    process.exit(1);
  }
}

async function shutdown() {
  console.log('Encerrando Reservations Service...');

  server.close(async () => {
    await closeConnection();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();