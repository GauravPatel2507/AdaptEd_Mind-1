// Authentication middleware — verifies Firebase ID tokens
const { adminAuth } = require('../config/firebase-admin');
const logger = require('../utils/logger');

/**
 * Middleware that verifies the Firebase ID token from the Authorization header.
 * Attaches the decoded user to req.user on success.
 *
 * Usage: router.get('/protected', authMiddleware, handler);
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Missing or invalid Authorization header. Expected: Bearer <token>',
    });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || null,
    };
    next();
  } catch (error) {
    // In development, fall back to decoding the JWT payload without verification
    // This allows the backend to work without Firebase Admin credentials
    if (process.env.NODE_ENV !== 'production') {
      try {
        const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
        req.user = {
          uid: payload.user_id || payload.sub,
          email: payload.email || null,
          name: payload.name || null,
        };
        logger.warn('AUTH', 'Using unverified token in dev mode — set GOOGLE_APPLICATION_CREDENTIALS for production');
        return next();
      } catch (decodeError) {
        // Token is completely invalid
      }
    }
    logger.authFailure(error.message, req.ip);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token.',
    });
  }
};

/**
 * Optional auth — if a token is present it is verified, but requests without
 * a token are still allowed through (req.user will be null).
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || null,
    };
  } catch {
    req.user = null;
  }
  next();
};

module.exports = { authMiddleware, optionalAuth };
