// Lightweight structured logger for AdaptEd Mind Backend
// Provides consistent, parseable log output with levels and context

const config = require('../config');

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const CURRENT_LEVEL = config.nodeEnv === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;

const formatTimestamp = () => new Date().toISOString();

const formatMessage = (level, category, message, meta = null) => {
  const entry = {
    timestamp: formatTimestamp(),
    level,
    category,
    message,
  };
  if (meta) entry.meta = meta;
  return entry;
};

const logger = {
  debug: (category, message, meta) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
      const entry = formatMessage('DEBUG', category, message, meta);
      console.log(`[${entry.timestamp}] [DEBUG] [${category}] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },

  info: (category, message, meta) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      const entry = formatMessage('INFO', category, message, meta);
      console.log(`[${entry.timestamp}] [INFO] [${category}] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },

  warn: (category, message, meta) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
      const entry = formatMessage('WARN', category, message, meta);
      console.warn(`[${entry.timestamp}] [WARN] [${category}] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },

  error: (category, message, meta) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
      const entry = formatMessage('ERROR', category, message, meta);
      console.error(`[${entry.timestamp}] [ERROR] [${category}] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },

  // Specialized loggers for common operations
  request: (req) => {
    logger.info('HTTP', `${req.method} ${req.path}`, {
      ip: req.ip,
      userId: req.user?.uid || 'anonymous',
      userAgent: req.get('User-Agent')?.substring(0, 80),
    });
  },

  authFailure: (reason, ip) => {
    logger.warn('AUTH', `Authentication failed: ${reason}`, { ip });
  },

  aiRequest: (userId, subject, difficulty) => {
    logger.info('AI', `Test generation requested`, { userId, subject, difficulty });
  },

  aiSuccess: (subject, questionCount, source, durationMs) => {
    logger.info('AI', `Test generated successfully`, {
      subject, questionCount, source, durationMs,
    });
  },

  aiError: (subject, attempt, error) => {
    logger.error('AI', `Generation failed`, { subject, attempt, error: error.message || error });
  },

  rateLimitHit: (ip, userId, endpoint) => {
    logger.warn('RATE_LIMIT', `Rate limit exceeded`, { ip, userId, endpoint });
  },
};

module.exports = logger;
