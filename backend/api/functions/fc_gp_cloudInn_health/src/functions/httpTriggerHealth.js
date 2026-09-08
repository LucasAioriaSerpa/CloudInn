const { app } = require("@azure/functions");
const { MongoClient, ServerApiVersion } = require("mongodb");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
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

async function checkHealth(options = {}) {
  const startTime = Date.now();
  const mongoUri = getAzureMongoUri(options);

  const dbName = process.env.MONGO_DB_NAME || "cloudinn";

  let dbStatus = "NOT_CONFIGURED";
  let dbLatencyMs = null;
  let dbError = null;

  if (mongoUri) {
    let client = options.mongoClient;
    let shouldClose = false;

    try {
      if (!client) {
        client = new MongoClient(mongoUri, {
          serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
          },
          serverSelectionTimeoutMS: 3000,
          connectTimeoutMS: 3000,
        });
        shouldClose = true;
        await client.connect();
      }

      const pingStart = Date.now();
      await client.db(dbName).command({ ping: 1 });
      dbLatencyMs = Date.now() - pingStart;
      dbStatus = "CONNECTED";
    } catch (err) {
      dbStatus = "UNREACHABLE";
      dbError = err.message || "Falha de conexão com MongoDB";
    } finally {
      if (shouldClose && client) {
        try {
          await client.close();
        } catch (_) {}
      }
    }
  }

  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = Number(process.uptime().toFixed(2));
  const totalDurationMs = Date.now() - startTime;

  // Status geral: UP se DB conectado ou não configurado (modo offline/fallback ativo);
  // DEGRADED se URI configurada mas inacessível.
  const overallStatus = dbStatus === "UNREACHABLE" ? "DEGRADED" : "UP";

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    service: "fc_gp_cloudInn_health",
    version: "1.0.0",
    uptimeSeconds,
    responseTimeMs: totalDurationMs,
    checks: {
      api: {
        status: "UP",
        name: "CloudInn Health Service",
        environment: process.env.NODE_ENV || "production",
      },
      database: {
        status: dbStatus,
        provider: "MongoDB",
        database: dbName,
        latencyMs: dbLatencyMs,
        error: dbError,
        note:
          dbStatus === "NOT_CONFIGURED"
            ? "Banco não configurado via MONGO_BD_URI; frontend opera com mockStorage autônomo."
            : undefined,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        memory: {
          rssMb: Number((memoryUsage.rss / 1024 / 1024).toFixed(2)),
          heapUsedMb: Number((memoryUsage.heapUsed / 1024 / 1024).toFixed(2)),
          heapTotalMb: Number((memoryUsage.heapTotal / 1024 / 1024).toFixed(2)),
        },
      },
    },
  };
}

/**
 * Handler HTTP da Azure Function de Health Check.
 */
async function handler(request, context, options = {}) {
  const log = (...args) => {
    if (context && typeof context.log === "function") {
      context.log(...args);
    } else {
      console.log(...args);
    }
  };
  log(
    `[fc_gp_cloudInn_health] Processando requisição ${request?.method || "GET"}`,
  );

  if (request?.method === "OPTIONS") {
    return {
      status: 204,
      headers: corsHeaders,
    };
  }

  try {
    const healthData = await checkHealth(options);
    const httpStatus = healthData.status === "DEGRADED" ? 503 : 200;

    return {
      status: httpStatus,
      headers: corsHeaders,
      body: JSON.stringify(healthData),
    };
  } catch (error) {
    if (context?.error) {
      context.error("[fc_gp_cloudInn_health] Erro inesperado:", error);
    }
    return {
      status: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        status: "DOWN",
        timestamp: new Date().toISOString(),
        error: error.message || "Erro interno no check de saúde.",
      }),
    };
  }
}

app.http("httpTrigger1", {
  methods: ["GET", "HEAD", "OPTIONS"],
  authLevel: "anonymous",
  handler,
});

module.exports = {
  handler,
  checkHealth,
  corsHeaders,
};
