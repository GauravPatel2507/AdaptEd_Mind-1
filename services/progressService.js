// Progress and Analytics Service - Modules 1, 4
import { db } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  limit 
} from 'firebase/firestore';

// Get student progress for a subject
export const getSubjectProgress = async (userId, subjectId) => {
  try {
    const progressRef = doc(db, 'progress', `${userId}_${subjectId}`);
    const progressDoc = await getDoc(progressRef);
    
    if (progressDoc.exists()) {
      return { success: true, data: progressDoc.data() };
    }
    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all progress for a student
export const getAllProgress = async (userId) => {
  try {
    const progressRef = collection(db, 'progress');
    const q = query(progressRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    const progressData = [];
    snapshot.forEach((doc) => {
      progressData.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: progressData };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update progress after completing a lesson/quiz
export const updateProgress = async (userId, subjectId, progressUpdate) => {
  try {
    const progressRef = doc(db, 'progress', `${userId}_${subjectId}`);
    const progressDoc = await getDoc(progressRef);
    
    if (progressDoc.exists()) {
      await updateDoc(progressRef, {
        ...progressUpdate,
        lastUpdated: new Date().toISOString()
      });
    } else {
      await setDoc(progressRef, {
        userId,
        subjectId,
        ...progressUpdate,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Identify learning gaps (Module 1)
export const identifyLearningGaps = async (userId) => {
  try {
    // Get all quiz results for the user
    const quizResultsRef = collection(db, 'quizResults');
    const q = query(
      quizResultsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    
    const topicScores = {};
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.topicScores) {
        Object.entries(data.topicScores).forEach(([topic, score]) => {
          if (!topicScores[topic]) {
            topicScores[topic] = { total: 0, count: 0 };
          }
          topicScores[topic].total += score;
          topicScores[topic].count += 1;
        });
      }
    });
    
    // Calculate averages and identify weak areas
    const learningGaps = Object.entries(topicScores)
      .map(([topic, data]) => ({
        topic,
        averageScore: Math.round(data.total / data.count),
        attempts: data.count
      }))
      .filter(item => item.averageScore < 70)
      .sort((a, b) => a.averageScore - b.averageScore);
    
    return { success: true, data: learningGaps };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Generate performance analytics (Module 4)
export const getPerformanceAnalytics = async (userId, period = 'week') => {
  try {
    const startDate = getStartDate(period);
    
    // Get quiz results within period
    const quizResultsRef = collection(db, 'quizResults');
    const q = query(
      quizResultsRef,
      where('userId', '==', userId),
      where('createdAt', '>=', startDate.toISOString()),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    
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
    
    // Calculate analytics
    const analytics = {
      averageScore: totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0,
      totalQuizzes,
      dailyAverages: Object.entries(dailyScores).map(([date, data]) => ({
        date,
        average: Math.round(data.total / data.count)
      })),
      trend: calculateTrend(dailyScores)
    };
    
    return { success: true, data: analytics };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Helper functions
const getStartDate = (period) => {
  const now = new Date();
  switch (period) {
    case 'week':
      return new Date(now.setDate(now.getDate() - 7));
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1));
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    default:
      return new Date(now.setDate(now.getDate() - 7));
  }
};

const calculateTrend = (dailyScores) => {
  const dates = Object.keys(dailyScores).sort();
  if (dates.length < 2) return 'stable';
  
  const firstHalf = dates.slice(0, Math.floor(dates.length / 2));
  const secondHalf = dates.slice(Math.floor(dates.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, date) => 
    sum + dailyScores[date].total / dailyScores[date].count, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, date) => 
    sum + dailyScores[date].total / dailyScores[date].count, 0) / secondHalf.length;
  
  if (secondAvg > firstAvg + 5) return 'improving';
  if (secondAvg < firstAvg - 5) return 'declining';
  return 'stable';
};

export default {
  getSubjectProgress,
  getAllProgress,
  updateProgress,
  identifyLearningGaps,
  getPerformanceAnalytics
};
