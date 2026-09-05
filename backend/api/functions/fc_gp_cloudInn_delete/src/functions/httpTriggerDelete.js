const { app } = require("@azure/functions");
const { MongoClient, ServerApiVersion } = require("mongodb");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "DELETE, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, api_key, x-functions-key",
  "Content-Type": "application/json",
};

async function handler(request, context, options = {}) {
  const logger = context?.log || console.log;
  logger(
    `[fc_gp_cloudInn_delete] Processando requisição ${request?.method || "DELETE"} para "${request?.url || ""}"`,
  );

  if (request?.method === "OPTIONS") {
    return {
      status: 204,
      headers: corsHeaders,
    };
  }

  try {
    const mongoUri =
      options.mongoUri || process.env.MONGO_BD_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      return {
        status: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          code: "500",
          message:
            "A variável de ambiente MONGO_BD_URI / MONGO_URI não foi configurada.",
        }),
      };
    }

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

    if (!idParam) {
      return {
        status: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          code: "400",
          message: "Identificador (id) é obrigatório para realizar a exclusão.",
        }),
      };
    }

    const numId = Number(idParam);
    const filter = isNaN(numId)
      ? { id: idParam }
      : { $or: [{ id: numId }, { id: idParam }] };

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
