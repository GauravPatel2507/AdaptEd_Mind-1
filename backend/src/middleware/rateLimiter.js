// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * General rate limiter — applies to all routes.
 * Default: 100 requests per minute per IP.
 */
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.rateLimitHit(req.ip, req.user?.uid, req.path);
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
    });
  },
});

/**
 * Stricter rate limiter for AI endpoints — prevents API cost abuse.
 * Default: 10 requests per minute per IP.
 */
const aiLimiter = rateLimit({
  windowMs: config.aiRateLimit.windowMs,
  max: config.aiRateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by authenticated user if available, else by IP
    return req.user?.uid || req.ip;
  },
  handler: (req, res) => {
    logger.rateLimitHit(req.ip, req.user?.uid, req.path);
    res.status(429).json({
      success: false,
      error: 'AI generation rate limit exceeded. Please wait before generating another test.',
    });
  },
});

module.exports = { generalLimiter, aiLimiter };
