// Test generation API routes
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimiter');
const { validate, testGenerationSchema } = require('../middleware/validator');
const { generateAITest } = require('../services/aiService');

/**
 * POST /api/tests/generate
 * Generate an AI-powered quiz test.
 *
 * Headers: Authorization: Bearer <firebase_id_token>
 * Body: { subject, numberOfQuestions?, difficulty?, timeLimit?, userAvgScore? }
 */
router.post(
  '/generate',
  authMiddleware,
  aiLimiter,
  validate(testGenerationSchema),
  async (req, res, next) => {
    try {
      const { subject, numberOfQuestions, difficulty, timeLimit, userAvgScore } = req.body;

      console.log(`[AI] Generating test for user ${req.user.uid}: ${subject} (${difficulty || 'adaptive'})`);

      const result = await generateAITest(subject, {
        numberOfQuestions: numberOfQuestions || 10,
        difficulty: difficulty || 'adaptive',
        timeLimit: timeLimit || 15,
        userAvgScore: userAvgScore || null,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/tests/subjects
 * Get available subjects list.
 * Public endpoint (no auth required).
 */
router.get('/subjects', (req, res) => {
  const subjects = [
    { id: 'c_programming', name: 'Programming in C', icon: 'code-slash', color: '#6366F1' },
    { id: 'data_structures', name: 'Data Structures', icon: 'git-branch', color: '#10B981' },
    { id: 'oop', name: 'OOP (Java/Python/C++)', icon: 'cube', color: '#F59E0B' },
    { id: 'dbms', name: 'Database Management', icon: 'server', color: '#8B5CF6' },
    { id: 'os', name: 'Operating Systems', icon: 'desktop', color: '#14B8A6' },
    { id: 'networks', name: 'Computer Networks', icon: 'globe', color: '#3B82F6' },
    { id: 'software_eng', name: 'Software Engineering', icon: 'construct', color: '#EF4444' },
    { id: 'web_tech', name: 'Web Technologies', icon: 'logo-html5', color: '#F97316' },
    { id: 'algorithms', name: 'Design & Analysis of Algorithms', icon: 'analytics', color: '#0EA5E9' },
    { id: 'ai', name: 'Artificial Intelligence', icon: 'sparkles', color: '#A855F7' },
    { id: 'ml', name: 'Machine Learning', icon: 'trending-up', color: '#D946EF' },
  ];

  res.json({ success: true, data: subjects });
});

module.exports = router;
