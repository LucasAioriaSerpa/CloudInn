// Logger JSON (uma linha por evento). Mascara credenciais em URIs, CPF, telefone e e-mail (LGPD).
const MASKS = [
  [/([a-z][a-z0-9+.-]*:\/\/)[^\s:@/]+:[^\s@/]+@/gi, '$1***:***@'],
  [/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '***.***.***-**'],
  [/\+?\d{2}\s?\(?\d{2}\)?\s?9?\d{4}-?\d{4}/g, '***'],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '***@***']
];

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

const mask = value => MASKS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), String(value));

function serializeError(error, includeStack) {
  if (!error) return undefined;
  return {
    name: error.name,
    code: error.code,
    message: mask(error.message),
    ...(includeStack && error.stack ? { stack: mask(error.stack) } : {})
  };
}

function createLogger({ service, level = 'info', includeStack = false, write } = {}) {
  const minimum = LEVELS[level] ?? LEVELS.info;
  const output = write || ((line, lvl) => (lvl === 'error' ? process.stderr : process.stdout).write(`${line}\n`));

  const log = (lvl, message, fields = {}) => {
    if (LEVELS[lvl] < minimum) return;
    const { error, ...rest } = fields;
    const entry = {
      time: new Date().toISOString(),
      level: lvl,
      service,
      message: mask(message),
      ...rest,
      ...(error ? { error: serializeError(error, includeStack) } : {})
    };
    output(JSON.stringify(entry), lvl);
  };

  return {
    debug: (message, fields) => log('debug', message, fields),
    info: (message, fields) => log('info', message, fields),
    warn: (message, fields) => log('warn', message, fields),
    error: (message, fields) => log('error', message, fields)
  };
}

module.exports = { createLogger, mask };
