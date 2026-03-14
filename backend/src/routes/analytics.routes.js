// Analytics API routes
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminDb } = require('../config/firebase-admin');

/**
 * GET /api/analytics/me
 * Get analytics for the authenticated user.
 *
 * Query params: period=week|month|year (default: week)
 */
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const period = req.query.period || 'week';

    const startDate = getStartDate(period);

    // Query test attempts for the user in the given period
    const snapshot = await adminDb
      .collection('quizResults')
      .where('userId', '==', userId)
      .where('createdAt', '>=', startDate.toISOString())
      .orderBy('createdAt', 'asc')
      .get();

    const dailyScores = {};
    let totalScore = 0;
    let totalQuizzes = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const date = new Date(data.createdAt).toLocaleDateString();

      if (!dailyScores[date]) {
        dailyScores[date] = { total: 0, count: 0 };
      }
      dailyScores[date].total += data.score;
      dailyScores[date].count += 1;

      totalScore += data.score;
      totalQuizzes += 1;
    });

    const analytics = {
      averageScore: totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0,
      totalQuizzes,
      period,
      dailyAverages: Object.entries(dailyScores).map(([date, data]) => ({
        date,
        average: Math.round(data.total / data.count),
      })),
      trend: calculateTrend(dailyScores),
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/progress
 * Get subject-level progress for the authenticated user.
 */
router.get('/progress', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.uid;

    const snapshot = await adminDb
      .collection('progress')
      .where('userId', '==', userId)
      .get();

    const progressData = [];
    snapshot.forEach((doc) => {
      progressData.push({ id: doc.id, ...doc.data() });
    });

    res.json({ success: true, data: progressData });
  } catch (error) {
    next(error);
  }
});

// Helpers
function getStartDate(period) {
  const now = new Date();
  switch (period) {
    case 'week': return new Date(now.setDate(now.getDate() - 7));
    case 'month': return new Date(now.setMonth(now.getMonth() - 1));
    case 'year': return new Date(now.setFullYear(now.getFullYear() - 1));
    default: return new Date(now.setDate(now.getDate() - 7));
  }
}

function calculateTrend(dailyScores) {
  const dates = Object.keys(dailyScores).sort();
  if (dates.length < 2) return 'stable';

  const mid = Math.floor(dates.length / 2);
  const firstAvg = dates.slice(0, mid).reduce((sum, d) =>
    sum + dailyScores[d].total / dailyScores[d].count, 0) / mid;
  const secondAvg = dates.slice(mid).reduce((sum, d) =>
    sum + dailyScores[d].total / dailyScores[d].count, 0) / (dates.length - mid);

  if (secondAvg > firstAvg + 5) return 'improving';
  if (secondAvg < firstAvg - 5) return 'declining';
  return 'stable';
}

module.exports = router;
