const { z } = require('zod');

// Validação de formato da requisição. As regras de negócio (enums, transições) ficam no domínio.
const text = z.string().trim().min(1);
const optionalText = z.string().trim().optional();

const roomFields = {
  number: text,
  roomType: z.string(),
  floor: z.number().int().nullable().optional(),
  amenities: z.array(z.string()).optional()
};

const roomCreate = z.object({ hotelId: text, ...roomFields, status: z.string().optional() }).strict();
const roomUpdate = z.object({ ...roomFields, status: z.string().optional() }).strict();
const roomStatusChange = z.object({ status: z.string(), staffId: z.string().optional() }).strict();
const roomQuery = z.object({ hotelId: z.string().optional(), status: z.string().optional() }).strict();

const staffFields = {
  name: text,
  username: text,
  role: z.string(),
  email: z.string().trim().email().optional(),
  roleLabel: optionalText,
  department: optionalText,
  shift: optionalText,
  status: z.string().optional(),
  phone: optionalText,
  document: optionalText,
  avatar: optionalText,
  color: optionalText
};

const staffCreate = z.object({ hotelId: text, ...staffFields, password: z.string() }).strict();
const staffUpdate = z.object({ ...staffFields, password: z.string().optional() }).strict();
const staffQuery = z.object({
  hotelId: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  department: z.string().optional()
}).strict();
const credentials = z.object({ login: z.string(), password: z.string() }).strict();

module.exports = { roomCreate, roomUpdate, roomStatusChange, roomQuery, staffCreate, staffUpdate, staffQuery, credentials };
