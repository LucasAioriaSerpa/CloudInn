const { GetAggregatedDataHandler } = require('./features/aggregated-data/handler');
const { AggregatedDataAssembler } = require('./features/aggregated-data/assembler');
const { LoginHandler } = require('./features/auth/login/handler');

// Monta os casos de uso a partir dos adaptadores (portas) recebidos.
function createHandlers(ports) {
  return {
    getAggregatedData: new GetAggregatedDataHandler({ ...ports, assembler: new AggregatedDataAssembler() }),
    login: new LoginHandler(ports)
  };
}

module.exports = { createHandlers };
