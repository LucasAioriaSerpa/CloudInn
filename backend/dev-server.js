/**
 * @fileoverview Servidor HTTP Local Unificado para Desenvolvimento das Azure Functions do CloudInn.
 *
 * Executa as 5 funções (select, insert, update, delete, health) em um único processo Node.js na porta 7071.
 * Aceita requisições nos caminhos do Azure:
 *   GET    http://localhost:7071/api/httpTriggerSelect?entity=reservation
 *   POST   http://localhost:7071/api/httpTriggerInsert
 *   PUT    http://localhost:7071/api/httpTriggerUpdate?action=checkin&id=1002
 *   DELETE http://localhost:7071/api/httpTriggerDelete?entity=reservation&id=1001
 *   GET    http://localhost:7071/api/httpTriggerHealth
 * E também nas rotas REST do Swagger (/reservation, /room, /guest, /health).
 */

const http = require("http");
const { azureFunctionsMiddleware } = require("./localBridge.cjs");

const PORT = process.env.AZURE_FUNCTIONS_PORT || 7071;

const server = http.createServer((req, res) => {
  // Executa o middleware das funções
  const handled = azureFunctionsMiddleware(req, res, () => {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ code: "404", message: "Endpoint não encontrado no servidor de funções locais." }));
  });
});

server.listen(PORT, () => {
  console.log(`=====================================================================`);
  console.log(` CloudInn — Servidor Local de Azure Functions rodando na porta ${PORT}`);
  console.log(`=====================================================================`);
  console.log(` MongoDB: ${process.env.MONGO_BD_URI ? "Conectado ao MongoDB Atlas" : "Banco de Dados em Memória Ativo"}`);
  console.log(` Rotas disponíveis:`);
  console.log(`   - SELECT: http://localhost:${PORT}/api/httpTriggerSelect?entity=reservation`);
  console.log(`   - INSERT: http://localhost:${PORT}/api/httpTriggerInsert`);
  console.log(`   - UPDATE: http://localhost:${PORT}/api/httpTriggerUpdate`);
  console.log(`   - DELETE: http://localhost:${PORT}/api/httpTriggerDelete`);
  console.log(`   - HEALTH: http://localhost:${PORT}/api/httpTriggerHealth`);
  console.log(`=====================================================================`);
});
