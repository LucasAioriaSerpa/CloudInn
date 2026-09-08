const { app } = require("@azure/functions");
const { MongoClient, ServerApiVersion } = require("mongodb");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, api_key, x-functions-key",
  "Content-Type": "application/json",
};

function sanitizeAndExtractMongoUri(raw) {
  if (!raw || typeof raw !== "string") return null;
  let s = raw.trim();

  // Remove aspas envolventes ("...", '...', \"...\")
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  if (s.startsWith('\\"') && s.endsWith('\\"')) {
    s = s.slice(2, -2).trim();
  }

  let extracted = null;
  // Verifica se inicia diretamente com mongodb:// ou mongodb+srv://
  if (s.startsWith("mongodb://") || s.startsWith("mongodb+srv://")) {
    extracted = s;
  } else {
    // Se contiver mongodb:// ou mongodb+srv:// no corpo da string (ex: MONGO_BD_URI=mongodb+srv://...)
    const match = s.match(/(mongodb(?:\+srv)?:\/\/[^\s"']+)/i);
    if (match && match[1]) {
      extracted = match[1].trim();
      if (
        (extracted.startsWith('"') && extracted.endsWith('"')) ||
        (extracted.startsWith("'") && extracted.endsWith("'"))
      ) {
        extracted = extracted.slice(1, -1).trim();
      }
    }
  }

  if (
    extracted &&
    (extracted.startsWith("mongodb://") || extracted.startsWith("mongodb+srv://"))
  ) {
    try {
      const urlObj = new URL(extracted);
      if (!urlObj.pathname || urlObj.pathname === "/") {
        urlObj.pathname = "/db_cloudinn";
        if (!urlObj.searchParams.has("retryWrites")) {
          urlObj.searchParams.set("retryWrites", "true");
        }
        if (!urlObj.searchParams.has("w")) {
          urlObj.searchParams.set("w", "majority");
        }
        return urlObj.toString();
      }
    } catch (_) {}
    return extracted;
  }

  return null;
}

function maskMongoUri(uri) {
  if (!uri || typeof uri !== "string") return "";
  try {
    return uri.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");
  } catch {
    return "mongodb://***";
  }
}

function getAzureMongoUri(options = {}) {
  if (options.mongoUri !== undefined) {
    if (!options.mongoUri) return undefined;
    return sanitizeAndExtractMongoUri(options.mongoUri) || undefined;
  }

  // 1. Azure Connection Strings (injetadas automaticamente pelo Azure com o prefixo CUSTOMCONNSTR_ ou SQLAZURECONNSTR_)
  const azureConnCandidates = [
    process.env.CUSTOMCONNSTR_MONGO_BD_URI,
    process.env.CUSTOMCONNSTR_MONGO_URI,
    process.env.CUSTOMCONNSTR_MONGODB_URI,
    process.env.CUSTOMCONNSTR_MongoDB,
    process.env.CUSTOMCONNSTR_MongoDbConnection,
    process.env.CUSTOMCONNSTR_defaultConnection,
    process.env.SQLAZURECONNSTR_MONGO_BD_URI,
    process.env.SQLAZURECONNSTR_MongoDB,
  ];
  for (const candidate of azureConnCandidates) {
    const sanitized = sanitizeAndExtractMongoUri(candidate);
    if (sanitized) return sanitized;
  }

  // 2. Variáveis de ambiente / App Settings diretas
  const directCandidates = [
    process.env.MONGO_BD_URI,
    process.env.MONGO_URI,
    process.env.MONGODB_URI,
    process.env.MongoDbConnection,
    process.env.MongoDB,
    process.env.MONGO_URL,
    process.env.MONGODB_URL,
  ];
  for (const candidate of directCandidates) {
    const sanitized = sanitizeAndExtractMongoUri(candidate);
    if (sanitized) return sanitized;
  }

  // 3. Varredura dinâmica para Connection Strings ou variáveis contendo URI MongoDB
  for (const [key, val] of Object.entries(process.env)) {
    if (
      key.startsWith("CUSTOMCONNSTR_") ||
      key.toUpperCase().includes("MONGO") ||
      key.toUpperCase().includes("CONN") ||
      key.toUpperCase().includes("DB")
    ) {
      const sanitized = sanitizeAndExtractMongoUri(val);
      if (sanitized) return sanitized;
    }
  }

  for (const val of Object.values(process.env)) {
    const sanitized = sanitizeAndExtractMongoUri(val);
    if (sanitized) return sanitized;
  }

  return undefined;
}

async function handler(request, context, options = {}) {
  const log = (...args) => {
    if (context && typeof context.log === "function") {
      context.log(...args);
    } else {
      console.log(...args);
    }
  };
  log(
    `[fc_gp_cloudInn_insert] Processando requisição ${request?.method || "POST"} para "${request?.url || ""}"`,
  );

  // Tratamento de preflight CORS
  if (request?.method === "OPTIONS") {
    return {
      status: 204,
      headers: corsHeaders,
    };
  }

  try {
    const mongoUri = getAzureMongoUri(options);
    if (!mongoUri) {
      const checkedKeys = Object.keys(process.env).filter(
        (k) =>
          k.startsWith("CUSTOMCONNSTR_") ||
          k.toUpperCase().includes("MONGO") ||
          k.toUpperCase().includes("CONN"),
      );
      log(
        `[fc_gp_cloudInn_insert] AVISO: URI do MongoDB não encontrada ou inválida. Variáveis com nomes relacionados no Azure: ${checkedKeys.length > 0 ? checkedKeys.join(", ") : "nenhuma"}`,
      );
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          code: "500",
          message:
            "A connection string do MongoDB não foi encontrada ou não possui formato válido ('mongodb://' ou 'mongodb+srv://') neste Azure Function App. Configure MONGO_BD_URI ou Connection String no Azure Portal sem aspas.",
          detectedEnvKeys: checkedKeys,
        }),
      };
    }
    log(`[fc_gp_cloudInn_insert] Conectando ao MongoDB: ${maskMongoUri(mongoUri)}`);

    const body =
      options.body !== undefined
        ? options.body
        : await request.json().catch(() => ({}));
    const query = request?.query || new URLSearchParams();
    const queryEntity = query.get ? query.get("entity") : undefined;

    // Identifica o tipo de entidade com base no parâmetro ou estrutura dos dados
    const isGuest =
      queryEntity === "guest" ||
      (body.name && body.document && !body.checkInDate && !body.roomType);
    const isRoom =
      queryEntity === "room" ||
      (body.number && body.roomType && !body.checkInDate);
    const isReservation = !isGuest && !isRoom;

    const client =
      options.client ||
      new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 15000,
        maxPoolSize: 10,
        minPoolSize: 0,
      });

    if (!options.client) {
      await client.connect();
    }
    const db = client.db(process.env.MONGO_DB_NAME || "db_cloudinn");

    // Garante criação dos índices no MongoDB
    if (typeof db.collection === "function") {
      try {
        const guestsColl = db.collection("guests");
        const roomsColl = db.collection("rooms");
        const resColl = db.collection("reservations");
        if (typeof guestsColl.createIndex === "function") {
          await Promise.allSettled([
            guestsColl.createIndex({ id: 1 }, { unique: true }),
            guestsColl.createIndex({ document: 1 }, { unique: true }),
            roomsColl.createIndex({ id: 1 }, { unique: true }),
            roomsColl.createIndex({ number: 1 }, { unique: true }),
            resColl.createIndex({ id: 1 }, { unique: true }),
            resColl.createIndex({ guestId: 1 }),
            resColl.createIndex({ roomId: 1 }),
          ]);
        }
      } catch (_) {}
    }

    if (isReservation) {
      // Validação estrita conforme Swagger: required: [guest, checkInDate, checkOutDate]
      if (!body.guest || !body.checkInDate || !body.checkOutDate) {
        await client.close();
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            code: "400",
            message:
              "Dados inválidos: os campos 'guest', 'checkInDate' e 'checkOutDate' são obrigatórios.",
          }),
        };
      }

      if (!body.guest.name || !body.guest.document) {
        await client.close();
        return {
          status: 422,
          headers: corsHeaders,
          body: JSON.stringify({
            code: "422",
            message:
              "Erro de validação: 'guest.name' e 'guest.document' são obrigatórios.",
          }),
        };
      }

      // Validação de datas
      const checkIn = new Date(body.checkInDate);
      const checkOut = new Date(body.checkOutDate);
      if (
        isNaN(checkIn.getTime()) ||
        isNaN(checkOut.getTime()) ||
        checkOut <= checkIn
      ) {
        await client.close();
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            code: "400",
            message:
              "A data de check-out deve ser posterior à data de check-in.",
          }),
        };
      }

      const validStatuses = ["pending", "active", "completed", "cancelled"];
      const status = validStatuses.includes(body.status)
        ? body.status
        : "pending";

      // Gerar ID numérico único sequencial para reserva
      const lastRes = await db
        .collection("reservations")
        .find()
        .sort({ id: -1 })
        .limit(1)
        .toArray();
      const nextId =
        lastRes.length > 0 && typeof lastRes[0].id === "number"
          ? lastRes[0].id + 1
          : 10;

      // 1. Identificar ou cadastrar o Hóspede na coleção 'guests'
      let guestId = body.guest.id ? Number(body.guest.id) : null;
      if (!guestId) {
        const existingGuest = await db
          .collection("guests")
          .findOne({ document: String(body.guest.document).trim() });
        if (existingGuest && typeof existingGuest.id === "number") {
          guestId = existingGuest.id;
        } else {
          const lastGuest = await db
            .collection("guests")
            .find()
            .sort({ id: -1 })
            .limit(1)
            .toArray();
          guestId =
            lastGuest.length > 0 && typeof lastGuest[0].id === "number"
              ? lastGuest[0].id + 1
              : 1;
        }
      }

      const guestDoc = {
        id: Number(guestId),
        name: String(body.guest.name).trim(),
        document: String(body.guest.document).trim(),
        email: body.guest.email ? String(body.guest.email).trim() : "",
        phone: body.guest.phone ? String(body.guest.phone).trim() : "",
      };

      await db.collection("guests").updateOne(
        { document: guestDoc.document },
        { $set: guestDoc },
        { upsert: true },
      );

      // 2. Identificar ou cadastrar o Quarto na coleção 'rooms'
      let roomId = body.room?.id
        ? Number(body.room.id)
        : body.roomId
          ? Number(body.roomId)
          : null;
      let roomNumber = body.room?.number
        ? String(body.room.number).trim()
        : "101A";
      let roomType = body.room?.roomType
        ? String(body.room.roomType).trim()
        : "STD";
      let roomStatus =
        status === "active"
          ? "occupied"
          : body.room?.status || "reserved";

      if (!roomId) {
        const existingRoom = await db
          .collection("rooms")
          .findOne({ number: roomNumber });
        if (existingRoom && typeof existingRoom.id === "number") {
          roomId = existingRoom.id;
          roomType = existingRoom.roomType || roomType;
        } else {
          const parsedNum = parseInt(roomNumber, 10);
          roomId = !isNaN(parsedNum) && parsedNum > 0 ? parsedNum : 101;
        }
      }

      const roomDoc = {
        id: Number(roomId),
        number: roomNumber,
        roomType: roomType,
        status: roomStatus,
      };

      await db.collection("rooms").updateOne(
        { number: roomDoc.number },
        { $set: roomDoc },
        { upsert: true },
      );

      // 3. Documento da Reserva exatamente conforme especificação solicitada:
      // { "id": 10, "guestId": 1, "roomId": 101, "checkInDate": "...", "checkOutDate": "...", "status": "pending" }
      const reservationDoc = {
        id: Number(body.id || nextId),
        guestId: Number(guestId),
        roomId: Number(roomId),
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        status: status,
      };

      await db.collection("reservations").insertOne(reservationDoc);

      await client.close();

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          ...reservationDoc,
          guest: guestDoc,
          room: roomDoc,
        }),
      };
    }

    if (isGuest) {
      // Validação estrita do Hóspede (RF02, Swagger)
      if (!body.name || !body.document) {
        await client.close();
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            code: "400",
            message:
              "Entrada inválida: 'name' e 'document' são campos obrigatórios para o cadastro de hóspede.",
          }),
        };
      }

      const lastGuest = await db
        .collection("guests")
        .find()
        .sort({ id: -1 })
        .limit(1)
        .toArray();
      const nextId =
        lastGuest.length > 0 && typeof lastGuest[0].id === "number"
          ? lastGuest[0].id + 1
          : 1;

      const guestDoc = {
        id: Number(body.id || nextId),
        name: String(body.name).trim(),
        document: String(body.document).trim(),
        email: body.email ? String(body.email).trim() : "",
        phone: body.phone ? String(body.phone).trim() : "",
      };

      await db.collection("guests").insertOne(guestDoc);
      await client.close();

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(guestDoc),
      };
    }

    if (isRoom) {
      // Validação de Quarto
      if (!body.number || !body.roomType || !body.status) {
        await client.close();
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            code: "400",
            message:
              "Entrada inválida: 'number', 'roomType' e 'status' são obrigatórios.",
          }),
        };
      }

      const lastRoom = await db
        .collection("rooms")
        .find()
        .sort({ id: -1 })
        .limit(1)
        .toArray();
      const nextRoomId =
        lastRoom.length > 0 && typeof lastRoom[0].id === "number"
          ? lastRoom[0].id + 1
          : 101;

      const roomDoc = {
        id: Number(body.id || nextRoomId),
        number: String(body.number).trim(),
        roomType: String(body.roomType).trim(),
        status: String(body.status).trim(),
      };

      await db.collection("rooms").insertOne(roomDoc);
      await client.close();

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(roomDoc),
      };
    }

    await client.close();
    return {
      status: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        code: "400",
        message: "Formato de entidade não reconhecido.",
      }),
    };
  } catch (error) {
    if (context?.error) {
      context.error("[fc_gp_cloudInn_insert] Erro na inserção:", error);
    }
    const msg = error?.message || String(error);
    const causeMsg = error?.cause?.message || "";
    const fullErr = `${msg} ${causeMsg}`;

    if (
      fullErr.includes("SSL alert number 80") ||
      fullErr.includes("tlsv1 alert internal error") ||
      fullErr.includes("MongoServerSelectionError")
    ) {
      return {
        status: 503,
        headers: corsHeaders,
        body: JSON.stringify({
          code: "503",
          type: "MongoNetworkSecurityError",
          message:
            "Falha de conexão TLS com o MongoDB Atlas (SSL alert 80). O endereço IP de saída da Azure Function não está autorizado no firewall (Network Access) do MongoDB Atlas.",
          solution:
            "Acesse MongoDB Atlas (https://cloud.mongodb.com) -> Security -> Network Access -> Add IP Address -> 'Allow Access from Anywhere' (0.0.0.0/0) -> Confirm. Aguarde cerca de 1 minuto para propagação.",
          technicalDetails: msg,
        }),
      };
    }

    return {
      status: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        code: "500",
        message:
          error.message ||
          "Erro inesperado ao processar inserção no banco de dados.",
      }),
    };
  }
}

app.http("httpTrigger1", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler,
});

module.exports = {
  handler,
  corsHeaders,
};
