// Authentication verification routes
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * POST /api/auth/verify
 * Verify a Firebase ID token. Returns user info if valid.
 */
router.post('/verify', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name,
    },
  });
});

module.exports = router;
