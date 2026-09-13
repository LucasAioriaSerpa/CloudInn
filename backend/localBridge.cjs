/**
 * @fileoverview Bridge e Adaptador Local para Execução das Azure Functions do CloudInn.
 *
 * Permite que os 5 handlers reais das Azure Functions sejam executados:
 * 1. Como middleware dentro do Vite dev server (na porta 3000 em ambiente unificado)
 * 2. Como servidor HTTP standalone (porta 7071 para desenvolvimento desacoplado)
 *
 * Se MONGO_BD_URI estiver configurada, conecta diretamente ao MongoDB Atlas.
 * Se MONGO_BD_URI não estiver configurada, utiliza banco de dados em memória persistente
 * durante a sessão, permitindo testar toda a lógica das Functions sem erros de inicialização.
 */

const url = require("url");
const {
  handler: selectHandler,
} = require("./api/functions/fc_gp_cloudInn_select/src/functions/httpTriggerSelect.js");
const {
  handler: insertHandler,
} = require("./api/functions/fc_gp_cloudInn_insert/src/functions/httpTriggerInsert.js");
const {
  handler: updateHandler,
} = require("./api/functions/fc_gp_cloudInn_update/src/functions/httpTriggerUpdate.js");
const {
  handler: deleteHandler,
} = require("./api/functions/fc_gp_cloudInn_delete/src/functions/httpTriggerDelete.js");
const {
  handler: healthHandler,
} = require("./api/functions/fc_gp_cloudInn_health/src/functions/httpTriggerHealth.js");
const {
  createMockDb,
} = require("./api/functions/fc_gp_cloudInn_select/test/mockDb.js");

// Dados iniciais para semente em memória
const SEED_GUESTS = [
  {
    id: 1,
    name: "João Silva",
    document: "123.456.789-00",
    email: "joao.silva@email.com",
    phone: "+55 41 99999-9999",
  },
  {
    id: 2,
    name: "Maria Fernandes",
    document: "987.654.321-11",
    email: "maria.fernandes@corp.com",
    phone: "+55 11 98888-7777",
  },
  {
    id: 3,
    name: "Carlos Eduardo Souza",
    document: "456.789.123-22",
    email: "carlos.souza@tech.io",
    phone: "+55 21 97777-6666",
  },
  {
    id: 4,
    name: "Ana Beatriz Lima",
    document: "321.654.987-33",
    email: "ana.lima@design.com",
    phone: "+55 31 96666-5555",
  },
  {
    id: 5,
    name: "Roberto Alvarez",
    document: "PASS-BR908123",
    email: "roberto.alvarez@viagens.com.br",
    phone: "+55 47 95555-4444",
  },
  {
    id: 6,
    name: "Juliana Mendes",
    document: "654.321.789-44",
    email: "juliana.mendes@advocacia.com",
    phone: "+55 61 94444-3333",
  },
];

const SEED_ROOMS = [
  // 10x - 1º Andar (Standard)
  { id: 101, number: "101", roomType: "STD", status: "occupied" },
  { id: 102, number: "102", roomType: "STD", status: "available" },
  { id: 103, number: "103", roomType: "STD", status: "dirty" },
  { id: 104, number: "104", roomType: "STD", status: "cleaning" },
  // 20x - 2º Andar (Deluxe)
  { id: 201, number: "201", roomType: "DLX", status: "reserved" },
  { id: 202, number: "202", roomType: "DLX", status: "available" },
  { id: 203, number: "203", roomType: "DLX", status: "occupied" },
  { id: 204, number: "204", roomType: "DLX", status: "dirty" },
  // 30x - 3º Andar (Suíte Master)
  { id: 301, number: "301", roomType: "SUI", status: "reserved" },
  { id: 302, number: "302", roomType: "SUI", status: "available" },
  { id: 303, number: "303", roomType: "SUI", status: "available" },
  { id: 304, number: "304", roomType: "SUI", status: "available" },
  // 40x - 4º Andar (Presidencial)
  { id: 401, number: "401", roomType: "PRE", status: "available" },
  { id: 402, number: "402", roomType: "PRE", status: "occupied" },
  { id: 403, number: "403", roomType: "PRE", status: "available" },
  { id: 404, number: "404", roomType: "PRE", status: "available" },
];

const SEED_RESERVATIONS = [
  {
    id: 1001,
    guest: SEED_GUESTS[0],
    room: SEED_ROOMS[0],
    checkInDate: "2026-08-24T14:00:00Z",
    checkOutDate: "2026-08-28T12:00:00Z",
    status: "active",
  },
  {
    id: 1002,
    guest: SEED_GUESTS[1],
    room: SEED_ROOMS[4],
    checkInDate: "2026-08-25T14:00:00Z",
    checkOutDate: "2026-08-30T11:00:00Z",
    status: "pending",
  },
  {
    id: 1003,
    guest: SEED_GUESTS[2],
    room: SEED_ROOMS[6],
    checkInDate: "2026-08-23T15:00:00Z",
    checkOutDate: "2026-08-26T10:00:00Z",
    status: "active",
  },
  {
    id: 1004,
    guest: SEED_GUESTS[3],
    room: SEED_ROOMS[8],
    checkInDate: "2026-08-26T14:00:00Z",
    checkOutDate: "2026-08-29T12:00:00Z",
    status: "pending",
  },
  {
    id: 1005,
    guest: SEED_GUESTS[4],
    room: SEED_ROOMS[2],
    checkInDate: "2026-08-20T14:00:00Z",
    checkOutDate: "2026-08-24T11:00:00Z",
    status: "completed",
  },
  {
    id: 1006,
    guest: SEED_GUESTS[5],
    room: SEED_ROOMS[13],
    checkInDate: "2026-08-22T16:00:00Z",
    checkOutDate: "2026-08-27T12:00:00Z",
    status: "active",
  },
];

const SEED_STAFF = [
  {
    id: 1,
    name: "Carlos Eduardo Mendes",
    username: "carlos.gerente",
    email: "carlos.mendes@cloudinn.com",
    role: "manager",
    roleLabel: "Gerente Geral",
    department: "Administração Geral",
    shift: "Diurno (Geral)",
    status: "active",
    phone: "+55 11 98888-1111",
    document: "111.222.333-44",
    avatar: "CM",
    color: "#14248A",
    createdAt: "2026-08-01T08:00:00Z",
    updatedAt: "2026-08-25T10:30:00Z",
  },
  {
    id: 2,
    name: "Roberto Silva Albuquerque",
    username: "roberto.subgerente",
    email: "roberto.silva@cloudinn.com",
    role: "sub_manager",
    roleLabel: "Sub-Gerente",
    department: "Operações & Recepção",
    shift: "Vespertino",
    status: "active",
    phone: "+55 11 98888-2222",
    document: "222.333.444-55",
    avatar: "RA",
    color: "#998FC7",
    createdAt: "2026-08-05T09:00:00Z",
    updatedAt: "2026-08-26T14:00:00Z",
  },
  {
    id: 3,
    name: "Camila Rocha Guimarães",
    username: "camila.recepcao",
    email: "camila.rocha@cloudinn.com",
    role: "receptionist",
    roleLabel: "Recepcionista",
    department: "Front Desk & Reservas",
    shift: "Manhã / Tarde",
    status: "active",
    phone: "+55 11 98888-3333",
    document: "333.444.555-66",
    avatar: "CR",
    color: "#14248A",
    createdAt: "2026-08-10T07:30:00Z",
    updatedAt: "2026-08-27T16:20:00Z",
  },
  {
    id: 4,
    name: "Maria Aparecida dos Santos",
    username: "maria.governanca",
    email: "maria.santos@cloudinn.com",
    role: "housekeeper",
    roleLabel: "Governanta Chefe",
    department: "Governança & Higienização",
    shift: "Manhã (07h às 15h)",
    status: "active",
    phone: "+55 11 98888-4444",
    document: "444.555.666-77",
    avatar: "MS",
    color: "#D4C2FC",
    createdAt: "2026-08-12T06:45:00Z",
    updatedAt: "2026-08-28T11:15:00Z",
  },
];

// Cliente em memória compartilhado para quando MONGO_BD_URI não estiver definida
const sharedMemoryDb = createMockDb({
  reservations: SEED_RESERVATIONS,
  rooms: SEED_ROOMS,
  guests: SEED_GUESTS,
  staff: SEED_STAFF,
});

/**
 * Cria o objeto HttpRequest v4 esperado pelos handlers do Azure Functions
 */
function createFunctionRequest(nodeReq, parsedUrl, bodyBuffer) {
  const query = new URLSearchParams(parsedUrl.query || "");
  const bodyText = bodyBuffer ? bodyBuffer.toString("utf-8") : "";

  return {
    method: nodeReq.method,
    url: nodeReq.url,
    query,
    headers: {
      get: (headerName) => {
        const val = nodeReq.headers[headerName.toLowerCase()];
        return Array.isArray(val) ? val[0] : val;
      },
    },
    json: async () => {
      if (!bodyText) return {};
      return JSON.parse(bodyText);
    },
    text: async () => bodyText,
  };
}

/**
 * Contexto de execução com logs
 */
const functionContext = {
  log: (...args) => console.log("[AzureFunction Local]", ...args),
  error: (...args) => console.error("[AzureFunction Local Error]", ...args),
  warn: (...args) => console.warn("[AzureFunction Local Warn]", ...args),
};

/**
 * Middleware para Node.js / Connect / Vite dev server
 */
function azureFunctionsMiddleware(req, res, next) {
  const parsedUrl = url.parse(req.url, false);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, api_key, x-functions-key",
  );
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  const pathname = parsedUrl.pathname || "";

  // Verifica se a rota é destinada às Azure Functions
  let targetHandler = null;
  let simulatedEntity = null;

  if (
    pathname.includes("httpTriggerSelect") ||
    pathname.includes("fc-cloudinn-select")
  ) {
    targetHandler = selectHandler;
  } else if (
    pathname.includes("httpTriggerInsert") ||
    pathname.includes("fc-cloudinn-insert")
  ) {
    targetHandler = insertHandler;
  } else if (
    pathname.includes("httpTriggerUpdate") ||
    pathname.includes("fc-cloudinn-update")
  ) {
    targetHandler = updateHandler;
  } else if (
    pathname.includes("httpTriggerDelete") ||
    pathname.includes("fc-cloudinn-delete")
  ) {
    targetHandler = deleteHandler;
  } else if (
    pathname.includes("httpTriggerHealth") ||
    pathname.includes("fc-cloudinn-health")
  ) {
    targetHandler = healthHandler;
  }

  // Tratamento de rotas REST do Swagger (/reservation, /room, /guest, /health)
  if (!targetHandler) {
    if (
      pathname.startsWith("/reservation") ||
      pathname.startsWith("/api/reservation")
    ) {
      simulatedEntity = "reservation";
      if (req.method === "GET") targetHandler = selectHandler;
      else if (req.method === "POST") {
        if (pathname.includes("/checkin") || pathname.includes("/checkout")) {
          targetHandler = updateHandler;
        } else {
          targetHandler = insertHandler;
        }
      } else if (req.method === "PUT") targetHandler = updateHandler;
      else if (req.method === "DELETE") targetHandler = deleteHandler;
    } else if (
      pathname.startsWith("/room") ||
      pathname.startsWith("/api/room")
    ) {
      simulatedEntity = "room";
      if (req.method === "GET") targetHandler = selectHandler;
      else if (req.method === "POST" || req.method === "PUT") {
        targetHandler =
          parsedUrl.query && parsedUrl.query.includes("status=")
            ? updateHandler
            : insertHandler;
      } else if (req.method === "DELETE") targetHandler = deleteHandler;
    } else if (
      pathname.startsWith("/guest") ||
      pathname.startsWith("/api/guest")
    ) {
      simulatedEntity = "guest";
      if (req.method === "GET") targetHandler = selectHandler;
      else if (req.method === "POST") targetHandler = insertHandler;
      else if (req.method === "PUT") targetHandler = updateHandler;
      else if (req.method === "DELETE") targetHandler = deleteHandler;
    } else if (
      pathname.startsWith("/staff") ||
      pathname.startsWith("/api/staff")
    ) {
      simulatedEntity = "staff";
      if (req.method === "GET") targetHandler = selectHandler;
      else if (req.method === "POST") targetHandler = insertHandler;
      else if (req.method === "PUT") targetHandler = updateHandler;
      else if (req.method === "DELETE") targetHandler = deleteHandler;
    } else if (pathname === "/health" || pathname === "/api/health") {
      targetHandler = healthHandler;
    }
  }

  if (!targetHandler) {
    if (next) next();
    return;
  }

  let chunks = [];
  req.on("data", (chunk) => chunks.push(chunk));
  
  req.on("end", async () => {
    try {
      const bodyBuffer = Buffer.concat(chunks);
      const fnRequest = createFunctionRequest(req, parsedUrl, bodyBuffer);
      console.log(`[localBridge] ${req.method} ${pathname}`);

      if (simulatedEntity && !fnRequest.query.get("entity")) {
        fnRequest.query.set("entity", simulatedEntity);
      }

      // Se URL tiver ID no path (/reservation/1001), extrai
      const pathParts = pathname.split("/").filter(Boolean);
      const possibleId = pathParts[pathParts.length - 1];
      if (
        possibleId &&
        !isNaN(Number(possibleId)) &&
        !fnRequest.query.get("id")
      ) {
        fnRequest.query.set("id", possibleId);
      }
      if (pathname.includes("/checkin")) {
        fnRequest.query.set("action", "checkin");
      } else if (pathname.includes("/checkout")) {
        fnRequest.query.set("action", "checkout");
      }

      const hasMongoUri = !!(
        process.env.MONGO_BD_URI ||
        process.env.MONGO_URI ||
        process.env.MONGODB_URI ||
        process.env.CUSTOMCONNSTR_MONGO_BD_URI ||
        process.env.CUSTOMCONNSTR_MONGO_URI ||
        process.env.CUSTOMCONNSTR_MongoDB ||
        process.env.CUSTOMCONNSTR_MongoDbConnection
      );
      const handlerOptions = hasMongoUri
        ? {}
        : {
            client: sharedMemoryDb.client,
            mongoUri: "mongodb://localhost:27017/cloudinn",
          };

      const result = await targetHandler(
        fnRequest,
        functionContext,
        handlerOptions,
      );

      // Responde ao cliente HTTP
      res.statusCode = result.status || 200;
      if (result.headers) {
        for (const [key, value] of Object.entries(result.headers)) {
          if (!res.headersSent) {
            res.setHeader(key, value);
          }
        }
      }
      res.end(result.body || "");
    } catch (err) {
      console.error(
        "[azureFunctionsMiddleware] Erro ao processar requisição:",
        err,
      );
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end(
          JSON.stringify({
            code: "500",
            message: err.message || "Erro interno no servidor de funções.",
          }),
        );
      }
    }
  });
}

module.exports = {
  azureFunctionsMiddleware,
  sharedMemoryDb,
};
