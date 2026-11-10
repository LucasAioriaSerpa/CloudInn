const { z } = require('zod');

// Validação de formato da requisição. As regras de negócio (datas, status, valores) ficam no domínio.
const text = z.string().trim().min(1);
const nullableText = z.string().trim().nullable().optional();
const date = z.string().trim().min(1);
const amount = z.union([z.number(), z.string().trim().min(1)]);

const reservationCreate = z.object({
  guestId: text,
  hotelId: text,
  roomId: text,
  checkInDate: date,
  checkOutDate: date,
  totalAmount: amount,
  originChannel: z.string().optional(),
  // Também aceitos pelo cabeçalho Idempotency-Key (preferencial).
  idempotencyKey: z.string().trim().min(1).max(255).optional(),
  consumer: z.string().trim().min(1).max(100).optional(),
  changedBy: z.string().trim().max(80).optional()
}).strict();

const reservationUpdate = z.object({
  roomId: text.optional(),
  checkInDate: date.optional(),
  checkOutDate: date.optional(),
  totalAmount: amount.optional(),
  originChannel: z.string().optional()
}).strict();

const statusAction = z.object({
  changedBy: z.string().trim().max(80).optional(),
  reason: z.string().trim().max(255).optional()
}).strict();

const reservationQuery = z.object({
  hotelId: z.string().optional(),
  roomId: z.string().optional(),
  guestId: z.string().optional(),
  status: z.string().optional(),
  date: z.string().optional()
}).strict();

const guestFields = {
  name: text,
  document: text,
  email: z.string().trim().email().nullable().optional(),
  phone: nullableText,
  vip: z.boolean().optional()
};

const guestCreate = z.object(guestFields).strict();
const guestUpdate = z.object(guestFields).partial().strict();
const guestQuery = z.object({ search: z.string().optional(), document: z.string().optional() }).strict();

module.exports = {
  reservationCreate, reservationUpdate, statusAction, reservationQuery, guestCreate, guestUpdate, guestQuery
};
