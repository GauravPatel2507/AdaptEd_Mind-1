// Backend configuration — loads from .env
require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    apiUrl: process.env.GEMINI_API_URL ||
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  aiRateLimit: {
    windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS || '10', 10),
  },

  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:8081')
      .split(',')
      .map(s => s.trim()),
  },
};

// Validate required config
if (!config.gemini.apiKey) {
  console.error('FATAL: GEMINI_API_KEY is not set in .env');
  process.exit(1);
}

module.exports = config;
