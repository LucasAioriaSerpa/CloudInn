const { app } = require("@azure/functions");
const { MongoClient, ServerApiVersion } = require("mongodb");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, api_key, x-functions-key",
  "Content-Type": "application/json",
};

async function handler(request, context, options = {}) {
  const logger = context?.log || console.log;
  logger(
    `[fc_gp_cloudInn_select] Processando requisição ${request?.method || "GET"} para "${request?.url || ""}"`,
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

        await client.close();

        if (!item) {
          return {
            status: 404,
            headers: corsHeaders,
            body: JSON.stringify({
              code: "404",
              message: `Reserva com ID #${idParam} não encontrada.`,
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
        const regex = new RegExp(searchParam, "i");
        filter.$or = [
          { "guest.name": regex },
          { "guest.document": regex },
          { "room.number": regex },
        ];
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
