/**
 * Helper de Banco de Dados Mockado em Memória para Testes das Azure Functions do CloudInn.
 */

function getNestedValue(obj, path) {
  if (!obj) return undefined;
  return path
    .split(".")
    .reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

function matchFilter(item, filter) {
  if (!filter || Object.keys(filter).length === 0) return true;

  if (filter.$or && Array.isArray(filter.$or)) {
    return filter.$or.some((subFilter) => matchFilter(item, subFilter));
  }

  for (const [key, value] of Object.entries(filter)) {
    if (key === "$or") continue;
    const itemVal = getNestedValue(item, key);

    if (value instanceof RegExp) {
      if (!value.test(String(itemVal || ""))) return false;
    } else if (key === "id") {
      if (String(itemVal) !== String(value)) return false;
    } else if (itemVal !== value) {
      return false;
    }
  }
  return true;
}

function sortAndLimit(array, sortSpec, limit) {
  const sorted = [...array];
  if (sortSpec) {
    const [field, dir] = Object.entries(sortSpec)[0] || [];
    if (field) {
      sorted.sort((a, b) => {
        const valA = getNestedValue(a, field);
        const valB = getNestedValue(b, field);
        if (valA < valB) return dir === -1 ? 1 : -1;
        if (valA > valB) return dir === -1 ? -1 : 1;
        return 0;
      });
    }
  }
  if (limit && typeof limit === "number") {
    return sorted.slice(0, limit);
  }
  return sorted;
}

/**
 * Cria uma instância de MongoClient mockada contendo dados em memória.
 * @param {Object} [initialData] - Dados iniciais por coleção
 */
function createMockDb(initialData = {}) {
  const collections = {
    reservations: (initialData.reservations || []).map((r) => ({ ...r })),
    rooms: (initialData.rooms || []).map((rm) => ({ ...rm })),
    guests: (initialData.guests || []).map((g) => ({ ...g })),
  };

  const getCollection = (name) => {
    if (!collections[name]) {
      collections[name] = [];
    }
    const items = collections[name];

    return {
      find: (filter = {}) => {
        const filtered = items.filter((item) => matchFilter(item, filter));
        return {
          sort: (sortSpec = {}) => ({
            limit: (n) => ({
              toArray: async () => sortAndLimit(filtered, sortSpec, n),
            }),
            toArray: async () => sortAndLimit(filtered, sortSpec),
          }),
          limit: (n) => ({
            toArray: async () => filtered.slice(0, n),
          }),
          toArray: async () => filtered,
        };
      },
      findOne: async (filter = {}) => {
        return items.find((item) => matchFilter(item, filter)) || null;
      },
      insertOne: async (doc) => {
        const item = { ...doc };
        items.push(item);
        return { acknowledged: true, insertedId: doc.id || Date.now() };
      },
      updateOne: async (filter, update, opts = {}) => {
        let item = items.find((i) => matchFilter(i, filter));
        if (!item && opts.upsert) {
          item = { ...(filter.$or ? {} : filter) };
          items.push(item);
        }
        if (item) {
          if (update.$set) {
            Object.assign(item, update.$set);
          }
          return { matchedCount: 1, modifiedCount: 1 };
        }
        return { matchedCount: 0, modifiedCount: 0 };
      },
      deleteOne: async (filter) => {
        const index = items.findIndex((i) => matchFilter(i, filter));
        if (index !== -1) {
          items.splice(index, 1);
          return { deletedCount: 1 };
        }
        return { deletedCount: 0 };
      },
    };
  };

  const client = {
    connect: async () => {},
    close: async () => {},
    db: (_dbName = "cloudinn") => ({
      collection: getCollection,
      command: async (cmd) => {
        if (cmd.ping) return { ok: 1 };
        return {};
      },
      admin: () => ({
        ping: async () => ({ ok: 1 }),
      }),
    }),
  };

  return { client, collections };
}

/**
 * Cria mock do contexto do Azure Functions.
 */
function createMockContext() {
  const logs = [];
  const errors = [];
  return {
    log: (...args) => logs.push(args.join(" ")),
    error: (...args) => errors.push(args.join(" ")),
    logs,
    errors,
  };
}

/**
 * Cria mock do objeto HttpRequest do Azure Functions v4.
 */
function createMockRequest({
  method = "GET",
  url = "http://localhost/api",
  query = {},
  body = null,
  headers = {},
} = {}) {
  const queryParams = new URLSearchParams(query);
  return {
    method,
    url,
    query: queryParams,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    json: async () => body || {},
  };
}

module.exports = {
  createMockDb,
  createMockContext,
  createMockRequest,
};
