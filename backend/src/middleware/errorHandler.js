// Global error handler middleware
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Centralized error handling middleware.
 * Must be registered LAST via app.use(errorHandler).
 */
const errorHandler = (err, req, res, _next) => {
  logger.error('HTTP', `${req.method} ${req.path}: ${err.message}`, {
    status: err.status,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });

  // Handle known error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.details || err.message,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  // Default to 500
  res.status(err.status || 500).json({
    success: false,
    error: config.nodeEnv === 'production'
      ? 'Internal server error'
      : err.message,
  });
};

module.exports = { errorHandler };
