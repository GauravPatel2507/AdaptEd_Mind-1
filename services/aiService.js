// AI Service — Client-side (Proxied through Backend)
// All AI API calls now go through the backend; no API keys on the client.

import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, query, where, limit, addDoc } from 'firebase/firestore';
import { DIFFICULTY_LEVELS, QUIZ_CONFIG } from '../constants/Config';
import api from './apiClient';

// ─── Shuffle options so correct answer position varies ────────────────
const shuffleQuestionOptions = (questions) => {
  return questions.map(q => {
    const correctAnswer = q.options[q.correct];
    const shuffled = [...q.options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return { ...q, options: shuffled, correct: shuffled.indexOf(correctAnswer) };
  });
};

// ─── Generate AI Test via Backend Proxy ───────────────────────────────
/**
 * Generate a test by calling the backend AI proxy.
 * Falls back to local questions if the backend is unreachable.
 */
export const generateAITest = async (subject, config = {}) => {
  const {
    numberOfQuestions = 10,
    difficulty = 'medium',
    timeLimit = 15,
    userAvgScore = null,
  } = config;

  try {
    // Call backend API (authenticated, rate-limited, validated)
    const result = await api.post('/api/tests/generate', {
      subject,
      numberOfQuestions,
      difficulty,
      timeLimit,
      userAvgScore,
    });

    if (result.success) {
      // Backend already shuffles options; re-shuffle on client for extra randomization
      const questions = shuffleQuestionOptions(result.data.questions);
      return {
        success: true,
        data: {
          ...result.data,
          questions,
        },
      };
    }

    // If backend returned an error but we got a response, fallback locally
    console.warn('Backend test generation failed:', result.error);
    return generateLocalFallbackTest(subject, numberOfQuestions, difficulty, timeLimit);
  } catch (error) {
    // Network error or backend unreachable — use local fallback
    console.warn('Backend unreachable, using local fallback:', error.message);
    return generateLocalFallbackTest(subject, numberOfQuestions, difficulty, timeLimit);
  }
};

// ─── Local Fallback (when backend is unavailable) ─────────────────────
const generateLocalFallbackTest = (subject, count, difficulty, timeLimit) => {
  const fallbackQuestions = getLocalFallbackQuestions(subject);
  const shuffled = fallbackQuestions
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
  const randomized = shuffleQuestionOptions(shuffled);

  return {
    success: true,
    data: {
      questions: randomized,
      subject,
      difficulty,
      timeLimit: timeLimit || 15,
      totalQuestions: randomized.length,
      generatedAt: new Date().toISOString(),
      isFallback: true,
    },
  };
};

// Minimal local fallback questions (subset — full set is on backend)
const getLocalFallbackQuestions = (subject) => {
  const fallbacks = {
    'Data Structures': [
      { id: 1, question: 'What is the time complexity of searching in a balanced BST?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'], correct: 1, explanation: 'Balanced BST halves search space each step' },
      { id: 2, question: 'Which data structure uses LIFO principle?', options: ['Queue', 'Stack', 'Array', 'Linked List'], correct: 1, explanation: 'Stack uses Last In, First Out' },
      { id: 3, question: 'Which traversal of BST gives sorted output?', options: ['Preorder', 'Inorder', 'Postorder', 'Level order'], correct: 1, explanation: 'Inorder traversal visits left-root-right giving sorted order' },
      { id: 4, question: 'What data structure is used for BFS?', options: ['Stack', 'Array', 'Queue', 'Heap'], correct: 2, explanation: 'BFS uses a queue for level-by-level traversal' },
      { id: 5, question: 'What is the average time complexity of hash table lookup?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correct: 3, explanation: 'Hash tables provide constant-time average lookup' },
    ],
    'Database Management': [
      { id: 1, question: 'What does SQL stand for?', options: ['Simple Query Language', 'Structured Query Language', 'Standard Query Logic', 'System Query Language'], correct: 1, explanation: 'SQL is Structured Query Language for managing databases' },
      { id: 2, question: 'Which normal form eliminates partial dependencies?', options: ['1NF', '2NF', '3NF', 'BCNF'], correct: 1, explanation: '2NF removes partial dependencies on primary key' },
      { id: 3, question: 'What is normalization?', options: ['Adding indexes', 'Reducing data redundancy', 'Creating backups', 'Encrypting data'], correct: 1, explanation: 'Normalization organizes data to reduce redundancy' },
      { id: 4, question: 'Which SQL clause filters grouped results?', options: ['WHERE', 'GROUP BY', 'HAVING', 'ORDER BY'], correct: 2, explanation: 'HAVING filters after GROUP BY, WHERE filters before' },
      { id: 5, question: 'What does ACID stand for?', options: ['Access, Control, Integrity, Data', 'Atomicity, Consistency, Isolation, Durability', 'Atomicity, Control, Isolation, Data', 'Access, Consistency, Integrity, Durability'], correct: 1, explanation: 'ACID properties ensure reliable transaction processing' },
    ],
  };

  return fallbacks[subject] || fallbacks['Data Structures'];
};

// ─── Adaptive Difficulty (retained for local use) ─────────────────────
export const calculateAdaptiveDifficulty = (performance) => {
  if (!performance || !performance.recentScores || performance.recentScores.length === 0) {
    return DIFFICULTY_LEVELS.MEDIUM;
  }

  const averageScore = performance.recentScores.reduce((a, b) => a + b, 0) / performance.recentScores.length;

  if (averageScore >= 90) {
    return Math.min(performance.currentDifficulty + 1, DIFFICULTY_LEVELS.EXPERT);
  } else if (averageScore >= 75) {
    return performance.currentDifficulty;
  } else if (averageScore >= 60) {
    return Math.max(performance.currentDifficulty - 0.5, DIFFICULTY_LEVELS.BEGINNER);
  } else {
    return Math.max(performance.currentDifficulty - 1, DIFFICULTY_LEVELS.BEGINNER);
  }
};

// ─── Recommended Difficulty (queries Firestore) ───────────────────────
export const getRecommendedDifficulty = async (userId, subjectId, topicId) => {
  try {
    const quizResultsRef = collection(db, 'quizResults');
    const q = query(
      quizResultsRef,
      where('userId', '==', userId),
      where('subjectId', '==', subjectId),
      where('topicId', '==', topicId),
      limit(5)
    );
    const snapshot = await getDocs(q);

    const scores = [];
    snapshot.forEach((doc) => {
      scores.push(doc.data().score);
    });

    if (scores.length === 0) {
      return { success: true, data: { difficulty: DIFFICULTY_LEVELS.EASY, reason: 'New topic - starting easy' } };
    }

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const trend = calculateScoreTrend(scores);

    let recommendedDifficulty;
    let reason;

    if (avgScore >= 85 && trend === 'improving') {
      recommendedDifficulty = DIFFICULTY_LEVELS.HARD;
      reason = 'Great progress! Ready for a challenge';
    } else if (avgScore >= 70) {
      recommendedDifficulty = DIFFICULTY_LEVELS.MEDIUM;
      reason = 'Good understanding - continuing at medium level';
    } else {
      recommendedDifficulty = DIFFICULTY_LEVELS.EASY;
      reason = 'Building foundation - simplified content';
    }

    return {
      success: true,
      data: { difficulty: recommendedDifficulty, reason, averageScore: avgScore, trend },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────
const calculateScoreTrend = (scores) => {
  if (scores.length < 2) return 'stable';
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  if (secondAvg > firstAvg + 5) return 'improving';
  if (secondAvg < firstAvg - 5) return 'declining';
  return 'stable';
};

export default {
  generateAITest,
  calculateAdaptiveDifficulty,
  getRecommendedDifficulty,
};
