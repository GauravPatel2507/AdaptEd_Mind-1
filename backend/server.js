// AdaptEd Mind — Backend Server (Restructured)
// All routes are authenticated, rate-limited, and validated.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const { generalLimiter } = require('./src/middleware/rateLimiter');
const { errorHandler } = require('./src/middleware/errorHandler');

// Routes
const authRoutes = require('./src/routes/auth.routes');
const testRoutes = require('./src/routes/test.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');

const app = express();

// ─── Security Middleware ─────────────────────────────────────────────
// Helmet adds security-related HTTP headers
app.use(helmet());

// CORS — permissive in dev (Expo Go on physical devices), restricted in production
app.use(cors({
  origin: config.nodeEnv === 'development' ? true : config.cors.allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Body parsing with size limits to prevent abuse
app.use(express.json({ limit: '1mb' }));

// General rate limiter — applies to all routes
app.use(generalLimiter);

// ─── Request Logging ──────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.request(req);
  next();
});

// ─── Routes ─────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check (public)
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Root
app.get('/', (_req, res) => {
  res.json({
    message: 'AdaptEd Mind API',
    version: '2.0.0',
    docs: '/health',
  });
});

// ─── 404 Handler ────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// ─── Global Error Handler (must be last) ────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────
app.listen(config.port, () => {
  logger.info('SERVER', `AdaptEd Mind API v2.0.0 running on port ${config.port}`, {
    environment: config.nodeEnv,
    corsOrigins: config.cors.allowedOrigins,
  });
});

module.exports = app;
