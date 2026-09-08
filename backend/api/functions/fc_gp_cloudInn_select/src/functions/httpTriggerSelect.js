const { app } = require("@azure/functions");
const { MongoClient, ServerApiVersion } = require("mongodb");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    `[fc_gp_cloudInn_select] Processando requisição ${request?.method || "GET"} para "${request?.url || ""}"`,
  );

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
        `[fc_gp_cloudInn_select] AVISO: URI do MongoDB não encontrada ou inválida. Variáveis com nomes relacionados no Azure: ${checkedKeys.length > 0 ? checkedKeys.join(", ") : "nenhuma"}`,
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
    log(`[fc_gp_cloudInn_select] Conectando ao MongoDB: ${maskMongoUri(mongoUri)}`);

    const query = request?.query || new URLSearchParams();
    const entity = query.get("entity") || "reservation";
    const idParam =
      query.get("id") ||
      query.get("reservationId") ||
      query.get("guestId") ||
      query.get("roomId");
    const statusParam = query.get("status");
    const documentParam = query.get("document");
    const searchParam = query.get("search");

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

    // 1. Consulta de Reservas (RF01, RF03, RF04, RF05, Swagger /reservation e /reservation/{id})
    if (entity === "reservation" || entity === "reservations") {
      const collection = db.collection("reservations");

      if (idParam) {
        const numId = Number(idParam);
        const filter = isNaN(numId)
          ? { id: idParam }
          : { $or: [{ id: numId }, { id: idParam }] };
        const item = await collection.findOne(filter, {
          projection: { _id: 0 },
        });

        if (!item) {
          await client.close();
          return {
            status: 404,
            headers: corsHeaders,
            body: JSON.stringify({
              code: "404",
              message: `Reserva com ID #${idParam} não encontrada.`,
            }),
          };
        }

        // Enriquecer com dados do hóspede e quarto se estiverem separados por ID
        let guest = item.guest;
        if (!guest && item.guestId) {
          guest = await db
            .collection("guests")
            .findOne({ id: item.guestId }, { projection: { _id: 0 } });
        }
        let room = item.room;
        if (!room && item.roomId) {
          room = await db
            .collection("rooms")
            .findOne({ id: item.roomId }, { projection: { _id: 0 } });
        }

        await client.close();

        return {
          status: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            ...item,
            guest: guest || item.guest,
            room: room || item.room,
          }),
        };
      }

      const filter = {};
      if (statusParam && statusParam !== "all") {
        filter.status = statusParam;
      }

      // Consulta de hóspedes e quartos para enriquecimento e busca
      const allGuests = await db
        .collection("guests")
        .find({}, { projection: { _id: 0 } })
        .toArray();
      const allRooms = await db
        .collection("rooms")
        .find({}, { projection: { _id: 0 } })
        .toArray();
      const guestMap = new Map(allGuests.map((g) => [g.id, g]));
      const roomMap = new Map(allRooms.map((r) => [r.id, r]));

      if (searchParam) {
        const regex = new RegExp(searchParam, "i");
        const matchingGuestIds = allGuests
          .filter(
            (g) =>
              regex.test(g.name || "") ||
              regex.test(g.document || "") ||
              regex.test(g.email || ""),
          )
          .map((g) => g.id);

        const matchingRoomIds = allRooms
          .filter((r) => regex.test(r.number || ""))
          .map((r) => r.id);

        filter.$or = [
          { "guest.name": regex },
          { "guest.document": regex },
          { "room.number": regex },
          { guestId: { $in: matchingGuestIds } },
          { roomId: { $in: matchingRoomIds } },
        ];
      }

      const rawItems = await collection
        .find(filter, { projection: { _id: 0 } })
        .sort({ id: -1 })
        .toArray();
      await client.close();

      const items = rawItems.map((r) => {
        const guest = guestMap.get(r.guestId) || r.guest;
        const room = roomMap.get(r.roomId) || r.room;
        return {
          ...r,
          guest: guest || r.guest,
          room: room || r.room,
        };
      });

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(items),
      };
    }

    // 2. Consulta de Quartos (RF06, RF10, RF11, Swagger /room e /room/{id})
    if (entity === "room" || entity === "rooms") {
      const collection = db.collection("rooms");

      if (idParam) {
        const numId = Number(idParam);
        const filter = isNaN(numId)
          ? { id: idParam }
          : { $or: [{ id: numId }, { id: idParam }] };
        const item = await collection.findOne(filter, {
          projection: { _id: 0 },
        });

        await client.close();

        if (!item) {
          return {
            status: 404,
            headers: corsHeaders,
            body: JSON.stringify({
              code: "404",
              message: `Quarto com ID #${idParam} não encontrado.`,
            }),
          };
        }

        return {
          status: 200,
          headers: corsHeaders,
          body: JSON.stringify(item),
        };
      }

      const filter = {};
      if (statusParam && statusParam !== "all") {
        filter.status = statusParam;
      }
      if (searchParam) {
        filter.number = new RegExp(searchParam, "i");
      }

      const items = await collection
        .find(filter, { projection: { _id: 0 } })
        .sort({ number: 1 })
        .toArray();
      await client.close();

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(items),
      };
    }

    // 3. Consulta de Hóspedes (RF02, Swagger /guest/{id})
    if (entity === "guest" || entity === "guests") {
      const collection = db.collection("guests");

      if (idParam) {
        const numId = Number(idParam);
        const filter = isNaN(numId)
          ? { id: idParam }
          : { $or: [{ id: numId }, { id: idParam }] };
        const item = await collection.findOne(filter, {
          projection: { _id: 0 },
        });

        await client.close();

        if (!item) {
          return {
            status: 404,
            headers: corsHeaders,
            body: JSON.stringify({
              code: "404",
              message: `Hóspede com ID #${idParam} não encontrado.`,
            }),
          };
        }

        return {
          status: 200,
          headers: corsHeaders,
          body: JSON.stringify(item),
        };
      }

      const filter = {};
      if (documentParam) {
        filter.document = documentParam;
      }
      if (searchParam) {
        const regex = new RegExp(searchParam, "i");
        filter.$or = [{ name: regex }, { document: regex }, { email: regex }];
      }

      const items = await collection
        .find(filter, { projection: { _id: 0 } })
        .sort({ id: -1 })
        .toArray();
      await client.close();

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify(items),
      };
    }

    await client.close();
    return {
      status: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        code: "400",
        message: `Entidade desconhecida: '${entity}'. Use 'reservation', 'room' ou 'guest'.`,
      }),
    };
  } catch (error) {
    if (context?.error) {
      context.error("[fc_gp_cloudInn_select] Erro na consulta:", error);
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
          error.message || "Erro inesperado ao consultar dados no MongoDB.",
      }),
    };
  }
}

app.http("httpTrigger1", {
  methods: ["GET", "POST", "OPTIONS"],
  authLevel: "anonymous",
  handler,
});

module.exports = {
  handler,
  corsHeaders,
};
