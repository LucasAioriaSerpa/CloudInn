const { app } = require('@azure/functions');
const { calculate, ValidationError } = require('../lib/analytics');

// POST /api/httpTriggerAnalytics  (o gateway expõe como POST /api/v1/analytics/calculate)
app.http('httpTriggerAnalytics', {
  methods: ['POST'],
  authLevel: 'function',               // exige x-functions-key (injetada pelo gateway)
  route: 'httpTriggerAnalytics',
  handler: async (request, context) => {
    const correlationId = request.headers.get('x-correlation-id') ?? 'n/a';
    try {
      const result = calculate(await request.json());
      context.log(`analytics ok correlationId=${correlationId}`);
      return { status: 200, jsonBody: result };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof SyntaxError) {
        return { status: 400, jsonBody: { error: error.message } };
      }
      context.error(`analytics falhou correlationId=${correlationId}`, error);
      return { status: 500, jsonBody: { error: 'internal error' } };
    }
  }
});
