const { app } = require("@azure/functions");
const { MongoClient, ServerApiVersion } = require("mongodb");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PUT, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, api_key, x-functions-key",
  "Content-Type": "application/json",
};

async function handler(request, context, options = {}) {
  const logger = context?.log || console.log;
  logger(
    `[fc_gp_cloudInn_update] Processando requisição ${request?.method || "POST"} para "${request?.url || ""}"`,
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

    const action = (query.get ? query.get("action") : undefined) || body.action;
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
    const statusParam =
      (query.get ? query.get("status") : undefined) || body.status;

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

    // 1. Operação de Check-in (RF07: POST /reservation/{id}/checkin)
    if (action === "checkin") {
      if (!idParam) {
        await client.close();
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            code: "400",
            message: "Identificador da reserva é obrigatório para check-in.",
          }),
        };
      }

      const numId = Number(idParam);
      const filter = isNaN(numId)
        ? { id: idParam }
        : { $or: [{ id: numId }, { id: idParam }] };
      const reservation = await db.collection("reservations").findOne(filter);

      if (!reservation) {
        await client.close();
        return {
          status: 404,
          headers: corsHeaders,
          body: JSON.stringify({
            code: "404",
            message: `Reserva #${idParam} não encontrada.`,
          }),
        };
      }

      if (
        reservation.status === "completed" ||
        reservation.status === "cancelled"
      ) {
        await client.close();
        return {
          status: 422,
          headers: corsHeaders,
          body: JSON.stringify({
            code: "422",
            message: `Status '${reservation.status}' inválido para check-in.`,
          }),
        };
      }

      await db.collection("reservations").updateOne(filter, {
        $set: {
          status: "active",
          checkedInAt: new Date().toISOString(),
          updatedAt: new Date(),
        },
      });

      // Atualiza status do quarto para 'occupied' (RF07)
      if (reservation.room?.number) {
        await db
          .collection("rooms")
          .updateOne(
            { number: reservation.room.number },
            { $set: { status: "occupied", updatedAt: new Date() } },
          );
      }

      await client.close();
      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          code: 200,
          type: "success",
          message: "Check-in realizado com sucesso",
        }),
      };
    }

    // 2. Operação de Check-out (RF08, RF09: POST /reservation/{id}/checkout)
    if (action === "checkout") {
      if (!idParam) {
        await client.close();
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            code: "400",
            message: "Identificador da reserva é obrigatório para check-out.",
          }),
        };
      }

      const numId = Number(idParam);
      const filter = isNaN(numId)
        ? { id: idParam }
        : { $or: [{ id: numId }, { id: idParam }] };
      const reservation = await db.collection("reservations").findOne(filter);

      if (!reservation) {
        await client.close();
        return {
          status: 404,
          headers: corsHeaders,
          body: JSON.stringify({
            code: "404",
            message: `Reserva #${idParam} não encontrada.`,
          }),
        };
      }

      await db.collection("reservations").updateOne(filter, {
        $set: {
          status: "completed",
          checkedOutAt: new Date().toISOString(),
          updatedAt: new Date(),
        },
      });

      // Altera o status do quarto para 'dirty' (RF08, RF09)
      if (reservation.room?.number) {
        await db
          .collection("rooms")
          .updateOne(
            { number: reservation.room.number },
            { $set: { status: "dirty", updatedAt: new Date() } },
          );
      }

      await client.close();
      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          code: 200,
          type: "success",
          message: "Check-out realizado com sucesso",
        }),
      };
    }

    // 3. Atualização de Quarto (RF06, RF10, RF11: POST /room/{id}?status=...)
    if (entity === "room" || query.get("roomId")) {
      if (!idParam) {
        await client.close();
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            code: "400",
            message: "Identificador do quarto é obrigatório.",
          }),
        };
      }

      const validStatuses = [
        "available",
        "reserved",
        "occupied",
        "dirty",
        "cleaning",
      ];
      if (statusParam && !validStatuses.includes(statusParam)) {
        await client.close();
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            code: "400",
            message: `Status de quarto inválido: '${statusParam}'.`,
          }),
        };
      }

      const numId = Number(idParam);
      const filter = isNaN(numId)
        ? { id: idParam }
        : { $or: [{ id: numId }, { id: idParam }] };
      const room = await db.collection("rooms").findOne(filter);

      if (!room) {
        await client.close();
        return {
          status: 404,
          headers: corsHeaders,
          body: JSON.stringify({
            code: "404",
            message: `Quarto #${idParam} não encontrado.`,
          }),
        };
      }

      const updateFields = { updatedAt: new Date() };
      if (statusParam) updateFields.status = statusParam;
      if (body.roomType) updateFields.roomType = body.roomType;
      if (body.number) updateFields.number = body.number;

      await db.collection("rooms").updateOne(filter, { $set: updateFields });
      await client.close();

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          code: 200,
          type: "success",
          message: "Status do quarto atualizado com sucesso",
        }),
      };
    }

    // 4. Atualização de Hóspede (RF02: PUT /guest/{guestId})
    if (entity === "guest" || query.get("guestId")) {
      if (!idParam) {
        await client.close();
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            code: "400",
            message: "Identificador do hóspede é obrigatório.",
          }),
        };
      }

      const numId = Number(idParam);
      const filter = isNaN(numId)
        ? { id: idParam }
        : { $or: [{ id: numId }, { id: idParam }] };
      const guest = await db.collection("guests").findOne(filter);

      if (!guest) {
        await client.close();
        return {
          status: 404,
          headers: corsHeaders,
          body: JSON.stringify({
            code: "404",
            message: `Hóspede #${idParam} não encontrado.`,
          }),
        };
      }

      const updateFields = { updatedAt: new Date() };
      if (body.name) updateFields.name = String(body.name).trim();
      if (body.document) updateFields.document = String(body.document).trim();
      if (body.email !== undefined) updateFields.email = body.email;
      if (body.phone !== undefined) updateFields.phone = body.phone;

      await db.collection("guests").updateOne(filter, { $set: updateFields });
      await client.close();

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          code: 200,
          type: "success",
          message: "Hóspede atualizado com sucesso",
        }),
      };
    }

    // 5. Atualização de Reserva Geral
    if (entity === "reservation" || query.get("reservationId")) {
      if (!idParam) {
        await client.close();
        return {
          status: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            code: "400",
            message: "Identificador da reserva é obrigatório.",
          }),
        };
      }

      const numId = Number(idParam);
      const filter = isNaN(numId)
        ? { id: idParam }
        : { $or: [{ id: numId }, { id: idParam }] };
      const reservation = await db.collection("reservations").findOne(filter);

      if (!reservation) {
        await client.close();
        return {
          status: 404,
          headers: corsHeaders,
          body: JSON.stringify({
            code: "404",
            message: `Reserva #${idParam} não encontrada.`,
          }),
        };
      }

      const updateFields = { updatedAt: new Date() };
      if (body.status) updateFields.status = body.status;
      if (body.checkInDate)
        updateFields.checkInDate = new Date(body.checkInDate).toISOString();
      if (body.checkOutDate)
        updateFields.checkOutDate = new Date(body.checkOutDate).toISOString();
      if (body.guest) updateFields.guest = body.guest;
      if (body.room) updateFields.room = body.room;

      await db
        .collection("reservations")
        .updateOne(filter, { $set: updateFields });
      await client.close();

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          code: 200,
          type: "success",
          message: "Reserva atualizada com sucesso",
        }),
      };
    }

    await client.close();
    return {
      status: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        code: "400",
        message: "Parâmetros de atualização inválidos.",
      }),
    };
  } catch (error) {
    if (context?.error) {
      context.error("[fc_gp_cloudInn_update] Erro na atualização:", error);
    }
    return {
      status: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        code: "500",
        message:
          error.message || "Erro inesperado ao atualizar registro no MongoDB.",
      }),
    };
  }
}

app.http("httpTrigger1", {
  methods: ["PUT", "POST", "PATCH", "OPTIONS"],
  authLevel: "anonymous",
  handler,
});

module.exports = {
  handler,
  corsHeaders,
};
