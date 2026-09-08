const { app } = require("@azure/functions");
const { MongoClient, ServerApiVersion } = require("mongodb");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "DELETE, POST, OPTIONS",
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

  // Verifica se inicia diretamente com mongodb:// ou mongodb+srv://
  if (s.startsWith("mongodb://") || s.startsWith("mongodb+srv://")) {
    return s;
  }

  // Se contiver mongodb:// ou mongodb+srv:// no corpo da string (ex: MONGO_BD_URI=mongodb+srv://...)
  const match = s.match(/(mongodb(?:\+srv)?:\/\/[^\s"']+)/i);
  if (match && match[1]) {
    let extracted = match[1].trim();
    if (
      (extracted.startsWith('"') && extracted.endsWith('"')) ||
      (extracted.startsWith("'") && extracted.endsWith("'"))
    ) {
      extracted = extracted.slice(1, -1).trim();
    }
    if (
      extracted.startsWith("mongodb://") ||
      extracted.startsWith("mongodb+srv://")
    ) {
      return extracted;
    }
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
    `[fc_gp_cloudInn_delete] Processando requisição ${request?.method || "DELETE"} para "${request?.url || ""}"`,
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
        `[fc_gp_cloudInn_delete] AVISO: URI do MongoDB não encontrada ou inválida. Variáveis com nomes relacionados no Azure: ${checkedKeys.length > 0 ? checkedKeys.join(", ") : "nenhuma"}`,
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
    log(`[fc_gp_cloudInn_delete] Conectando ao MongoDB: ${maskMongoUri(mongoUri)}`);

    const query = request?.query || new URLSearchParams();
    const body =
      options.body !== undefined
        ? options.body
        : await request.json().catch(() => ({}));

    const entity =
      (query.get ? query.get("entity") : undefined) ||
      body.entity ||
      "reservation";
    const idParam =
      (query.get ? query.get("id") : undefined) ||
      (query.get ? query.get("reservationId") : undefined) ||
      (query.get ? query.get("guestId") : undefined) ||
      (query.get ? query.get("roomId") : undefined) ||
      body.id;

    const isClearAll =
      idParam === "all" ||
      idParam === "*" ||
      body.all === true ||
      (query.get && query.get("all") === "true") ||
      body.action === "clear" ||
      (query.get && query.get("action") === "clear");

    if (!idParam && !isClearAll) {
      return {
        status: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          code: "400",
          message: "Identificador (id) é obrigatório para realizar a exclusão.",
        }),
      };
    }

    const client =
      options.client ||
      new MongoClient(mongoUri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
      });

    if (!options.client) {
      await client.connect();
    }
    const db = client.db(process.env.MONGO_DB_NAME || "cloudinn");

    // Limpeza total de coleções para o fluxo de restaurar dados demo
    if (isClearAll) {
      let totalDeleted = 0;
      if (entity === "all" || !entity) {
        const resDel = await db.collection("reservations").deleteMany({});
        const guestDel = await db.collection("guests").deleteMany({});
        totalDeleted =
          (resDel.deletedCount || 0) + (guestDel.deletedCount || 0);
      } else {
        let coll = "reservations";
        if (entity === "guest" || entity === "guests") coll = "guests";
        else if (entity === "room" || entity === "rooms") coll = "rooms";
        const delRes = await db.collection(coll).deleteMany({});
        totalDeleted = delRes.deletedCount || 0;
      }

      await client.close();
      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          code: 200,
          type: "success",
          message: `Banco de dados limpo com sucesso (${totalDeleted} registros removidos).`,
          deletedCount: totalDeleted,
        }),
      };
    }

    const numId = Number(idParam);
    const filter = isNaN(numId)
      ? { id: idParam }
      : { $or: [{ id: numId }, { id: idParam }] };

    let collectionName = "reservations";
    if (entity === "guest" || entity === "guests") {
      collectionName = "guests";
    } else if (entity === "room" || entity === "rooms") {
      collectionName = "rooms";
    }

    const existingRecord = await db.collection(collectionName).findOne(filter);
    if (!existingRecord) {
      await client.close();
      return {
        status: 404,
        headers: corsHeaders,
        body: JSON.stringify({
          code: "404",
          message: `Registro #${idParam} não encontrado na coleção '${collectionName}' para exclusão.`,
        }),
      };
    }

    const deleteResult = await db.collection(collectionName).deleteOne(filter);

    // Se for uma reserva excluída e o quarto estiver associado, libera o quarto se estiver reservado
    if (
      collectionName === "reservations" &&
      existingRecord.room?.number &&
      existingRecord.status === "pending"
    ) {
      await db
        .collection("rooms")
        .updateOne(
          { number: existingRecord.room.number, status: "reserved" },
          { $set: { status: "available", updatedAt: new Date() } },
        );
    }

    await client.close();

    return {
      status: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        code: 200,
        type: "success",
        message: `Registro #${idParam} excluído com sucesso da coleção '${collectionName}'.`,
        deletedCount: deleteResult.deletedCount,
        id: idParam,
      }),
    };
  } catch (error) {
    if (context?.error) {
      context.error("[fc_gp_cloudInn_delete] Erro na exclusão:", error);
    }
    return {
      status: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        code: "500",
        message:
          error.message || "Erro inesperado ao excluir registro no MongoDB.",
      }),
    };
  }
}

app.http("httpTrigger1", {
  methods: ["DELETE", "POST", "OPTIONS"],
  authLevel: "anonymous",
  handler,
});

module.exports = {
  handler,
  corsHeaders,
};
