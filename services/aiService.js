// AI Service - Mock Test Generator (Module 5) and Difficulty Adjuster (Module 3)
import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, query, where, limit, addDoc } from 'firebase/firestore';
import { DIFFICULTY_LEVELS, QUIZ_CONFIG } from '../constants/Config';

// Question bank structure (in production, this would come from Firebase)
const sampleQuestions = {
  math: {
    algebra: [
      { id: 1, question: 'Solve for x: 2x + 5 = 15', options: ['x = 5', 'x = 10', 'x = 7.5', 'x = 4'], correct: 0, difficulty: 2 },
      { id: 2, question: 'Factor: x² - 9', options: ['(x-3)(x+3)', '(x-9)(x+1)', '(x-3)²', 'Cannot factor'], correct: 0, difficulty: 3 },
      { id: 3, question: 'Solve: 3x² - 12 = 0', options: ['x = ±2', 'x = ±4', 'x = ±3', 'x = ±6'], correct: 0, difficulty: 4 },
    ],
    geometry: [
      { id: 4, question: 'Area of circle with radius 5?', options: ['25π', '10π', '5π', '50π'], correct: 0, difficulty: 2 },
      { id: 5, question: 'Sum of angles in a triangle?', options: ['180°', '360°', '90°', '270°'], correct: 0, difficulty: 1 },
    ],
  },
  science: {
    physics: [
      { id: 6, question: 'Unit of force?', options: ['Newton', 'Joule', 'Watt', 'Pascal'], correct: 0, difficulty: 1 },
      { id: 7, question: 'F = ma is known as?', options: ["Newton's 2nd Law", "Newton's 1st Law", 'Law of Gravity', 'Law of Motion'], correct: 0, difficulty: 2 },
    ],
    chemistry: [
      { id: 8, question: 'Atomic number of Carbon?', options: ['6', '12', '8', '14'], correct: 0, difficulty: 1 },
      { id: 9, question: 'Chemical formula for water?', options: ['H₂O', 'CO₂', 'O₂', 'H₂O₂'], correct: 0, difficulty: 1 },
    ],
  },
};

// Generate personalized mock test (Module 5)
export const generateMockTest = async (userId, subject, config = {}) => {
  const {
    numberOfQuestions = QUIZ_CONFIG.minQuestionsPerQuiz,
    difficulty = 'adaptive',
    topics = []
  } = config;

  try {
    // Get user's performance history to personalize
    const userPerformance = await getUserPerformanceBySubject(userId, subject);
    
    // Determine target difficulty based on performance or config
    let targetDifficulty;
    if (difficulty === 'adaptive') {
      targetDifficulty = calculateAdaptiveDifficulty(userPerformance);
    } else {
      targetDifficulty = DIFFICULTY_LEVELS[difficulty.toUpperCase()] || DIFFICULTY_LEVELS.MEDIUM;
    }
    
    // Get questions from database (using sample data here)
    const questions = await getQuestionsForTest(subject, targetDifficulty, numberOfQuestions, topics, userPerformance.weakTopics);
    
    // Create test document
    const testData = {
      userId,
      subject,
      questions,
      difficulty: targetDifficulty,
      timeLimit: config.timeLimit || QUIZ_CONFIG.defaultTimePerQuestion * numberOfQuestions,
      createdAt: new Date().toISOString(),
      status: 'pending',
      personalizedReason: getPersonalizationReason(userPerformance, targetDifficulty)
    };
    
    // Save to Firebase
    const testRef = await addDoc(collection(db, 'tests'), testData);
    
    return { 
      success: true, 
      data: { 
        testId: testRef.id, 
        ...testData 
      } 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get adaptive difficulty based on performance (Module 3)
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

// Get recommended next lesson difficulty (Module 3)
export const getRecommendedDifficulty = async (userId, subjectId, topicId) => {
  try {
    // Get recent performance on this topic
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
      data: { 
        difficulty: recommendedDifficulty, 
        reason,
        averageScore: avgScore,
        trend
      } 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Helper: Get user performance by subject
const getUserPerformanceBySubject = async (userId, subject) => {
  try {
    const quizResultsRef = collection(db, 'quizResults');
    const q = query(
      quizResultsRef,
      where('userId', '==', userId),
      where('subject', '==', subject),
      limit(10)
    );
    const snapshot = await getDocs(q);
    
    const scores = [];
    const topicScores = {};
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      scores.push(data.score);
      
      if (data.topicScores) {
        Object.entries(data.topicScores).forEach(([topic, score]) => {
          if (!topicScores[topic]) topicScores[topic] = [];
          topicScores[topic].push(score);
        });
      }
    });
    
    // Find weak topics
    const weakTopics = Object.entries(topicScores)
      .map(([topic, scores]) => ({
        topic,
        average: scores.reduce((a, b) => a + b, 0) / scores.length
      }))
      .filter(t => t.average < 60)
      .map(t => t.topic);
    
    return {
      recentScores: scores,
      currentDifficulty: scores.length > 0 
        ? (scores.reduce((a, b) => a + b, 0) / scores.length >= 75 ? DIFFICULTY_LEVELS.MEDIUM : DIFFICULTY_LEVELS.EASY)
        : DIFFICULTY_LEVELS.MEDIUM,
      weakTopics
    };
  } catch (error) {
    return { recentScores: [], currentDifficulty: DIFFICULTY_LEVELS.MEDIUM, weakTopics: [] };
  }
};

// Helper: Get questions for test
const getQuestionsForTest = async (subject, targetDifficulty, count, topics, weakTopics) => {
  // In production, this would query Firebase
  // For now, using sample data with difficulty-based filtering
  const subjectQuestions = sampleQuestions[subject.toLowerCase()] || {};
  let allQuestions = [];
  
  Object.entries(subjectQuestions).forEach(([topic, questions]) => {
    // Prioritize weak topics
    const weight = weakTopics.includes(topic) ? 2 : 1;
    for (let i = 0; i < weight; i++) {
      allQuestions = allQuestions.concat(questions);
    }
  });
  
  // Filter by difficulty range (±1 from target)
  const filteredQuestions = allQuestions.filter(q => 
    Math.abs(q.difficulty - targetDifficulty) <= 1
  );
  
  // Shuffle and select
  const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

// Helper: Calculate score trend
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

// Helper: Get personalization reason
const getPersonalizationReason = (performance, targetDifficulty) => {
  if (performance.weakTopics.length > 0) {
    return `Focused on areas that need improvement: ${performance.weakTopics.join(', ')}`;
  }
  if (targetDifficulty >= DIFFICULTY_LEVELS.HARD) {
    return 'Advanced level based on your excellent performance';
  }
  return 'Personalized based on your learning history';
};

export default {
  generateMockTest,
  calculateAdaptiveDifficulty,
  getRecommendedDifficulty
};
