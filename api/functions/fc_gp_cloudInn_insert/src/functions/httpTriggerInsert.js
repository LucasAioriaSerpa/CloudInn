const { app } = require("@azure/functions");
const { MongoClient, ServerApiVersion } = require("mongodb");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, api_key, x-functions-key",
  "Content-Type": "application/json",
};

app.http("httpTrigger1", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    context.log(
      `[fc_gp_cloudInn_insert] Processando requisição ${request.method} para "${request.url}"`,
    );

    // Tratamento de preflight CORS
    if (request.method === "OPTIONS") {
      return {
        status: 204,
        headers: corsHeaders,
      };
    }

    try {
      const mongoUri = process.env.MONGO_BD_URI || process.env.MONGO_URI;
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

      const body = await request.json().catch(() => ({}));
      const queryEntity = request.query.get("entity");

      // Identifica o tipo de entidade com base no parâmetro ou estrutura dos dados
      const isGuest =
        queryEntity === "guest" ||
        (body.name && body.document && !body.checkInDate && !body.roomType);
      const isRoom =
        queryEntity === "room" ||
        (body.number && body.roomType && !body.checkInDate);
      const isReservation = !isGuest && !isRoom;

      const client = new MongoClient(mongoUri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
      });

      await client.connect();
      const db = client.db(process.env.MONGO_DB_NAME || "cloudinn");

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

        // Gerar ID numérico único sequencial ou timestamp
        const lastRes = await db
          .collection("reservations")
          .find()
          .sort({ id: -1 })
          .limit(1)
          .toArray();
        const nextId =
          lastRes.length > 0 && typeof lastRes[0].id === "number"
            ? lastRes[0].id + 1
            : Date.now();

        const reservation = {
          id: body.id || nextId,
          guest: {
            id: body.guest.id || Date.now(),
            name: String(body.guest.name).trim(),
            email: body.guest.email
              ? String(body.guest.email).trim()
              : undefined,
            document: String(body.guest.document).trim(),
            phone: body.guest.phone
              ? String(body.guest.phone).trim()
              : undefined,
          },
          room: body.room
            ? {
                id: body.room.id || undefined,
                number: String(body.room.number),
                roomType: String(body.room.roomType || "STD"),
                status: String(
                  body.room.status ||
                    (status === "active" ? "occupied" : "reserved"),
                ),
              }
            : undefined,
          checkInDate: checkIn.toISOString(),
          checkOutDate: checkOut.toISOString(),
          status: status,
          createdAt: new Date(),
        };

        await db.collection("reservations").insertOne(reservation);

        // Sincroniza quarto associado se informado
        if (body.room?.number) {
          await db.collection("rooms").updateOne(
            { number: body.room.number },
            {
              $set: {
                status: status === "active" ? "occupied" : "reserved",
                updatedAt: new Date(),
              },
            },
            { upsert: false },
          );
        }

        // Sincroniza hóspede no catálogo
        if (body.guest?.document) {
          await db.collection("guests").updateOne(
            { document: body.guest.document },
            {
              $set: {
                id: reservation.guest.id,
                name: reservation.guest.name,
                email: reservation.guest.email,
                phone: reservation.guest.phone,
                updatedAt: new Date(),
              },
            },
            { upsert: true },
          );
        }

        await client.close();

        return {
          status: 200,
          headers: corsHeaders,
          body: JSON.stringify(reservation),
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
            : Date.now();

        const guest = {
          id: body.id || nextId,
          name: String(body.name).trim(),
          document: String(body.document).trim(),
          email: body.email ? String(body.email).trim() : undefined,
          phone: body.phone ? String(body.phone).trim() : undefined,
          createdAt: new Date(),
        };

        await db.collection("guests").insertOne(guest);
        await client.close();

        return {
          status: 200,
          headers: corsHeaders,
          body: JSON.stringify(guest),
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

        const room = {
          id: body.id || Date.now(),
          number: String(body.number).trim(),
          roomType: String(body.roomType).trim(),
          status: String(body.status).trim(),
          createdAt: new Date(),
        };

        await db.collection("rooms").insertOne(room);
        await client.close();

        return {
          status: 200,
          headers: corsHeaders,
          body: JSON.stringify(room),
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
      context.error("[fc_gp_cloudInn_insert] Erro na inserção:", error);
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
  },
});
