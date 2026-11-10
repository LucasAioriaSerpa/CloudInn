const { Router } = require('express');
const { NotFoundError } = require('../../application/errors');
const { requireRole } = require('../middleware/auth');

const MANAGEMENT_ROLES = ['manager', 'sub_manager'];
const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Ações de reserva que entram na auditoria: o BFF registra o usuário logado como autor (changedBy).
function isAuditedReservationAction(method, path) {
  if (method === 'POST' && path === '/reservations') return true;
  if (method === 'DELETE' && /^\/reservations\/[^/]+$/.test(path)) return true;
  return method === 'POST' && /^\/reservations\/[^/]+\/(checkin|checkout)$/.test(path);
}

function forwardTo(proxy, target) {
  return async (request, response) => {
    let body = request.body;
    const path = request.originalUrl.split('?')[0];
    if (isAuditedReservationAction(request.method, path)) {
      body = { ...(body && typeof body === 'object' ? body : {}), changedBy: request.user.username };
    }
    const result = await proxy.forward(target, {
      method: request.method,
      originalUrl: request.originalUrl,
      body,
      headers: { 'idempotency-key': request.get('idempotency-key') },
      correlationId: request.correlationId
    });
    if (result.status === 204 || result.body === null) return response.status(result.status).end();
    return response.status(result.status).json(result.body);
  };
}

// Repassa o CRUD aos microservices. Todas as rotas exigem login (aplicado no app).
function proxyRouter({ proxy }) {
  const router = Router();
  const toHotel = forwardTo(proxy, 'hotel');
  const toReservations = forwardTo(proxy, 'reservations');

  // Verificação de senha só pelo POST /auth/login.
  router.all('/staff/verify-credentials', () => { throw new NotFoundError('Rota não encontrada.'); });
  // Cadastro de funcionários é restrito à gerência.
  router.use('/staff', (request, response, next) => (WRITE_METHODS.includes(request.method) ? requireRole(...MANAGEMENT_ROLES)(request, response, next) : next()));

  router.use(['/rooms', '/staff', '/hotels'], toHotel);
  router.use(['/reservations', '/guests'], toReservations);
  return router;
}

module.exports = { proxyRouter };
