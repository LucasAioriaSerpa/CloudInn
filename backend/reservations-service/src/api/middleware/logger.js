function maskPii(str) {
  if (typeof str !== 'string') return str;
  let masked = str.replace(/\b(\d{3})\.?(\d{3})\.?(\d{3})-?(\d{2})\b/g, '***.***.***-**');
  masked = masked.replace(/(password|senha|secret)["']?\s*[:=]\s*["']?[^"',\s}]+/gi, '$1:"******"');
  return masked;
}

function loggerMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO',
      correlationId: req.correlationId || 'none',
      method: req.method,
      path: maskPii(req.originalUrl || req.url),
      statusCode: res.statusCode,
      durationMs
    };
    if (process.env.NODE_ENV !== 'test') {
      console.log(JSON.stringify(logEntry));
    }
  });

  next();
}

module.exports = {
  loggerMiddleware,
  maskPii
};
