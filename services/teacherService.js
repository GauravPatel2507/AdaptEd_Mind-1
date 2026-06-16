// Teacher Dashboard Service — Student Performance & Learning Gap Analysis
import { db } from '../config/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { SUBJECTS } from '../constants/Config';
import { PERFORMANCE_THRESHOLDS } from '../constants/Config';

// ── Fetch All Students ──────────────────────────────────────────────
export const getAllStudents = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'student'));
    const snapshot = await getDocs(q);

    const students = [];
    snapshot.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: students };
  } catch (error) {
    console.error('Error fetching students:', error.message);
    return { success: false, error: error.message };
  }
};

// ── Fetch All Quiz Results ──────────────────────────────────────────
export const getAllQuizResults = async () => {
  try {
    const quizResultsRef = collection(db, 'quizResults');
    const snapshot = await getDocs(quizResultsRef);

    const results = [];
    snapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });

    // Sort by date (newest first)
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { success: true, data: results };
  } catch (error) {
    console.error('Error fetching quiz results:', error.message);
    return { success: false, error: error.message };
  }
};

// ── Class Performance Overview ──────────────────────────────────────
export const getClassPerformanceOverview = (students, quizResults) => {
  if (!students.length || !quizResults.length) {
    return {
      totalStudents: students.length,
      classAverage: 0,
      totalTests: 0,
      topPerformers: [],
      atRiskStudents: [],
      subjectBreakdown: [],
    };
  }

  // Per-student aggregation
  const studentScores = {};
  quizResults.forEach((result) => {
    if (!studentScores[result.userId]) {
      studentScores[result.userId] = {
        total: 0,
        count: 0,
        subjects: {},
        lastActive: null,
      };
    }
    studentScores[result.userId].total += result.score || 0;
    studentScores[result.userId].count += 1;

    // Track last active date
    const resultDate = new Date(result.createdAt);
    if (!studentScores[result.userId].lastActive || resultDate > studentScores[result.userId].lastActive) {
      studentScores[result.userId].lastActive = resultDate;
    }

    // Subject-wise tracking
    const subjectKey = result.subjectId || result.subject?.toLowerCase().replace(/\s+/g, '_');
    if (subjectKey) {
      if (!studentScores[result.userId].subjects[subjectKey]) {
        studentScores[result.userId].subjects[subjectKey] = { total: 0, count: 0 };
      }
      studentScores[result.userId].subjects[subjectKey].total += result.score || 0;
      studentScores[result.userId].subjects[subjectKey].count += 1;
    }
  });

  // Build student performance list
  const studentPerformance = students.map((student) => {
    const scores = studentScores[student.id];
    const avg = scores ? Math.round(scores.total / scores.count) : null;
    return {
      ...student,
      averageScore: avg,
      totalTests: scores?.count || 0,
      lastActive: scores?.lastActive || null,
      subjects: scores?.subjects || {},
    };
  }).sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));

  // Class average (only students who have taken tests)
  const testedStudents = studentPerformance.filter((s) => s.averageScore !== null);
  const classAverage = testedStudents.length > 0
    ? Math.round(testedStudents.reduce((sum, s) => sum + s.averageScore, 0) / testedStudents.length)
    : 0;

  // Top performers (avg ≥ 90%)
  const topPerformers = studentPerformance.filter(
    (s) => s.averageScore !== null && s.averageScore >= PERFORMANCE_THRESHOLDS.excellent
  );

  // At-risk students (avg < 60%)
  const atRiskStudents = studentPerformance.filter(
    (s) => s.averageScore !== null && s.averageScore < PERFORMANCE_THRESHOLDS.average
  );

  // Subject-wise breakdown
  const subjectAggregates = {};
  quizResults.forEach((result) => {
    const subjectKey = result.subjectId || result.subject?.toLowerCase().replace(/\s+/g, '_');
    const subjectName = result.subject || subjectKey;
    if (subjectKey) {
      if (!subjectAggregates[subjectKey]) {
        subjectAggregates[subjectKey] = { name: subjectName, total: 0, count: 0, students: new Set() };
      }
      subjectAggregates[subjectKey].total += result.score || 0;
      subjectAggregates[subjectKey].count += 1;
      subjectAggregates[subjectKey].students.add(result.userId);
    }
  });

  const subjectBreakdown = Object.entries(subjectAggregates)
    .map(([key, data]) => {
      const subjectConfig = SUBJECTS.find((s) => s.id === key || s.name.toLowerCase() === key.toLowerCase());
      return {
        id: key,
        name: subjectConfig?.name || data.name,
        averageScore: Math.round(data.total / data.count),
        totalTests: data.count,
        studentCount: data.students.size,
        color: subjectConfig?.color || '#6366F1',
        icon: subjectConfig?.icon || 'school',
      };
    })
    .sort((a, b) => b.totalTests - a.totalTests);

  return {
    totalStudents: students.length,
    classAverage,
    totalTests: quizResults.length,
    topPerformers,
    atRiskStudents,
    subjectBreakdown,
    allStudents: studentPerformance,
  };
};

// ── Weekly Trends ───────────────────────────────────────────────────
export const getWeeklyTrends = (quizResults) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Initialize 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    days.push({
      date: date,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      fullLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: 0,
      count: 0,
      average: 0,
    });
  }

  // Aggregate scores by day
  quizResults.forEach((result) => {
    const resultDate = new Date(result.createdAt);
    resultDate.setHours(0, 0, 0, 0);

    if (resultDate >= sevenDaysAgo) {
      const dayIndex = days.findIndex(
        (d) => d.date.getTime() === resultDate.getTime()
      );
      if (dayIndex !== -1) {
        days[dayIndex].total += result.score || 0;
        days[dayIndex].count += 1;
      }
    }
  });

  // Calculate averages
  days.forEach((day) => {
    day.average = day.count > 0 ? Math.round(day.total / day.count) : 0;
  });

  const maxAverage = Math.max(...days.map((d) => d.average), 1);

  return { days, maxAverage };
};

// ── Learning Gap Analysis ───────────────────────────────────────────
export const getLearningGapAnalysis = (students, quizResults) => {
  // Per-student topic scores
  const studentTopicScores = {};
  const globalTopicScores = {};

  quizResults.forEach((result) => {
    const userId = result.userId;

    // Topic-level analysis from topicScores field
    if (result.topicScores) {
      Object.entries(result.topicScores).forEach(([topic, score]) => {
        // Per student
        if (!studentTopicScores[userId]) studentTopicScores[userId] = {};
        if (!studentTopicScores[userId][topic]) {
          studentTopicScores[userId][topic] = { total: 0, count: 0 };
        }
        studentTopicScores[userId][topic].total += score;
        studentTopicScores[userId][topic].count += 1;

        // Global
        if (!globalTopicScores[topic]) {
          globalTopicScores[topic] = { total: 0, count: 0, studentsBelow70: 0, totalStudents: new Set() };
        }
        globalTopicScores[topic].total += score;
        globalTopicScores[topic].count += 1;
        globalTopicScores[topic].totalStudents.add(userId);
        if (score < 70) {
          globalTopicScores[topic].studentsBelow70 += 1;
        }
      });
    }

    // Subject-level analysis as fallback
    const subjectKey = result.subjectId || result.subject?.toLowerCase().replace(/\s+/g, '_');
    if (subjectKey && !result.topicScores) {
      const topicName = result.subject || subjectKey;
      if (!studentTopicScores[userId]) studentTopicScores[userId] = {};
      if (!studentTopicScores[userId][topicName]) {
        studentTopicScores[userId][topicName] = { total: 0, count: 0 };
      }
      studentTopicScores[userId][topicName].total += result.score || 0;
      studentTopicScores[userId][topicName].count += 1;

      if (!globalTopicScores[topicName]) {
        globalTopicScores[topicName] = { total: 0, count: 0, studentsBelow70: 0, totalStudents: new Set() };
      }
      globalTopicScores[topicName].total += result.score || 0;
      globalTopicScores[topicName].count += 1;
      globalTopicScores[topicName].totalStudents.add(userId);
      if ((result.score || 0) < 70) {
        globalTopicScores[topicName].studentsBelow70 += 1;
      }
    }
  });

  // Weak topics per student
  const studentGaps = students
    .map((student) => {
      const topics = studentTopicScores[student.id] || {};
      const weakTopics = Object.entries(topics)
        .map(([topic, data]) => ({
          topic,
          averageScore: Math.round(data.total / data.count),
          attempts: data.count,
        }))
        .filter((t) => t.averageScore < 70)
        .sort((a, b) => a.averageScore - b.averageScore);

      // Calculate overall average
      const allScores = Object.values(topics);
      const overallAvg = allScores.length > 0
        ? Math.round(allScores.reduce((sum, t) => sum + t.total, 0) / allScores.reduce((sum, t) => sum + t.count, 0))
        : null;

      return {
        ...student,
        weakTopics,
        overallAverage: overallAvg,
        gapCount: weakTopics.length,
      };
    })
    .filter((s) => s.overallAverage !== null)
    .sort((a, b) => (a.overallAverage || 100) - (b.overallAverage || 100));

  // Common class-wide gaps (topics where ≥ 40% of students who attempted score < 70%)
  const commonGaps = Object.entries(globalTopicScores)
    .map(([topic, data]) => {
      const totalStudentsAttempted = data.totalStudents.size;
      // Count unique students below 70
      const failureRate = totalStudentsAttempted > 0
        ? Math.round((data.studentsBelow70 / data.count) * 100)
        : 0;
      return {
        topic,
        averageScore: Math.round(data.total / data.count),
        totalAttempts: data.count,
        studentsAttempted: totalStudentsAttempted,
        failureRate,
      };
    })
    .filter((t) => t.averageScore < 70)
    .sort((a, b) => a.averageScore - b.averageScore);

  // Priority list
  const priorityStudents = studentGaps
    .filter((s) => s.overallAverage !== null && s.overallAverage < 70)
    .map((s) => ({
      ...s,
      severity: s.overallAverage < 40 ? 'critical' : s.overallAverage < 55 ? 'warning' : 'watch',
    }));

  return {
    studentGaps,
    commonGaps,
    priorityStudents,
  };
};

// ── AI Intervention Suggestions ─────────────────────────────────────
export const generateInterventionSuggestions = (gaps) => {
  const suggestions = [];

  // Suggestions for common class gaps
  if (gaps.commonGaps && gaps.commonGaps.length > 0) {
    gaps.commonGaps.slice(0, 5).forEach((gap) => {
      if (gap.averageScore < 40) {
        suggestions.push({
          type: 'class_review',
          priority: 'high',
          icon: 'school',
          color: '#DC2626',
          title: `Re-teach: ${gap.topic}`,
          description: `Class average is only ${gap.averageScore}%. Consider a dedicated review session with visual aids and practice problems.`,
          actionLabel: 'Plan Review Session',
          topic: gap.topic,
        });
      } else if (gap.averageScore < 55) {
        suggestions.push({
          type: 'practice',
          priority: 'medium',
          icon: 'create',
          color: '#F59E0B',
          title: `Extra Practice: ${gap.topic}`,
          description: `Students are scoring ${gap.averageScore}% on average. Assign additional practice quizzes focusing on weak subtopics.`,
          actionLabel: 'Create Practice Set',
          topic: gap.topic,
        });
      } else {
        suggestions.push({
          type: 'reinforcement',
          priority: 'low',
          icon: 'refresh',
          color: '#3B82F6',
          title: `Reinforce: ${gap.topic}`,
          description: `Scores are at ${gap.averageScore}%. A quick refresher or group discussion could help solidify understanding.`,
          actionLabel: 'Schedule Refresher',
          topic: gap.topic,
        });
      }
    });
  }

  // Suggestions for priority students
  if (gaps.priorityStudents && gaps.priorityStudents.length > 0) {
    const criticalCount = gaps.priorityStudents.filter((s) => s.severity === 'critical').length;
    const warningCount = gaps.priorityStudents.filter((s) => s.severity === 'warning').length;

    if (criticalCount > 0) {
      suggestions.push({
        type: 'one_on_one',
        priority: 'high',
        icon: 'people',
        color: '#DC2626',
        title: `1-on-1 Attention Needed`,
        description: `${criticalCount} student${criticalCount > 1 ? 's are' : ' is'} in critical zone (below 40%). Consider individual mentoring sessions.`,
        actionLabel: 'View Students',
      });
    }

    if (warningCount > 0) {
      suggestions.push({
        type: 'small_group',
        priority: 'medium',
        icon: 'people-circle',
        color: '#F59E0B',
        title: `Small Group Tutoring`,
        description: `${warningCount} student${warningCount > 1 ? 's need' : ' needs'} extra support (below 55%). Group tutoring on shared weak topics could help.`,
        actionLabel: 'Form Groups',
      });
    }
  }

  // General suggestions
  if (gaps.commonGaps && gaps.commonGaps.length === 0) {
    suggestions.push({
      type: 'positive',
      priority: 'info',
      icon: 'checkmark-circle',
      color: '#10B981',
      title: 'Great Performance!',
      description: 'No common learning gaps detected across the class. Keep up the excellent teaching!',
      actionLabel: 'View Details',
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2, info: 3 };
    return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
  });
};

// ── Get Student Quiz History ────────────────────────────────────────
export const getStudentQuizHistory = (quizResults, studentId) => {
  return quizResults
    .filter((r) => r.userId === studentId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((r) => {
      const subjectConfig = SUBJECTS.find(
        (s) => s.id === r.subjectId || s.name.toLowerCase() === r.subject?.toLowerCase()
      );
      return {
        ...r,
        subjectName: subjectConfig?.name || r.subject,
        subjectColor: subjectConfig?.color || '#6366F1',
        subjectIcon: subjectConfig?.icon || 'school',
        formattedDate: formatTimeAgo(r.createdAt),
      };
    });
};

// ── Helpers ─────────────────────────────────────────────────────────
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default {
  getAllStudents,
  getAllQuizResults,
  getClassPerformanceOverview,
  getWeeklyTrends,
  getLearningGapAnalysis,
  generateInterventionSuggestions,
  getStudentQuizHistory,
};
