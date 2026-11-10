const { Router } = require('express');

// /health: o processo do BFF está de pé (liveness).
// /health/dependencies: situação de cada serviço dependente, para diagnóstico e demonstração.
function healthRouter({ healthDetails, dependencyChecks }) {
  const router = Router();

  router.get('/', (request, response) => {
    response.json({ status: 'ok', service: 'bff', ...healthDetails });
  });

  router.get('/dependencies', async (request, response) => {
    const entries = await Promise.all(Object.entries(dependencyChecks).map(async ([name, check]) => {
      try {
        await check({ correlationId: request.correlationId });
        return [name, { status: 'up' }];
      } catch (error) {
        return [name, { status: 'down', code: error.code ?? 'UNAVAILABLE' }];
      }
    }));
    const dependencies = Object.fromEntries(entries);
    const allUp = Object.values(dependencies).every(item => item.status === 'up');
    response.status(allUp ? 200 : 503).json({ status: allUp ? 'ok' : 'degraded', dependencies });
  });

  return router;
}

module.exports = { healthRouter };
