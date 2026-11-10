const { ValidationError } = require('../domain/errors');

// Mensagens do zod em português.
function errorMap(issue, context) {
  switch (issue.code) {
    case 'invalid_type':
      return { message: issue.received === 'undefined' ? 'campo obrigatório' : `tipo inválido (esperado ${issue.expected})` };
    case 'unrecognized_keys':
      return { message: `campos não permitidos: ${issue.keys.join(', ')}` };
    case 'too_small':
      return { message: 'não pode ser vazio' };
    case 'invalid_string':
      return { message: issue.validation === 'email' ? 'e-mail inválido' : 'texto inválido' };
    default:
      return { message: context.defaultError };
  }
}

function parseWith(schema, value) {
  const result = schema.safeParse(value, { errorMap });
  if (!result.success) {
    const details = result.error.issues.map(issue => `${issue.path.join('.') || 'corpo'}: ${issue.message}`).join('; ');
    throw new ValidationError(`Dados inválidos. ${details}`);
  }
  return result.data;
}

// O express.json só preenche req.body quando o content-type é application/json.
function requireJsonObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('O corpo da requisição deve ser um objeto JSON enviado com content-type application/json.');
  }
  return body;
}

const parseBody = (schema, body) => parseWith(schema, requireJsonObject(body));

module.exports = { parseWith, parseBody, requireJsonObject };
