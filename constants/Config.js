// App-wide configuration constants

export const APP_CONFIG = {
  name: 'AdaptEd Mind',
  version: '1.0.0',
  description: 'AI-Driven Personalized Learning Platform',
};

// User roles
export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
};

// Difficulty levels for adaptive learning
export const DIFFICULTY_LEVELS = {
  BEGINNER: 1,
  EASY: 2,
  MEDIUM: 3,
  HARD: 4,
  EXPERT: 5,
};

// Learning subjects
export const SUBJECTS = [
  { id: 'math', name: 'Mathematics', icon: 'calculator', color: '#6366F1' },
  { id: 'science', name: 'Science', icon: 'flask', color: '#10B981' },
  { id: 'english', name: 'English', icon: 'book', color: '#F59E0B' },
  { id: 'history', name: 'History', icon: 'landmark', color: '#8B5CF6' },
  { id: 'geography', name: 'Geography', icon: 'globe', color: '#14B8A6' },
  { id: 'physics', name: 'Physics', icon: 'atom', color: '#3B82F6' },
  { id: 'chemistry', name: 'Chemistry', icon: 'beaker', color: '#EF4444' },
  { id: 'biology', name: 'Biology', icon: 'leaf', color: '#22C55E' },
  { id: 'computer', name: 'Computer Science', icon: 'laptop', color: '#6B7280' },
  { id: 'arts', name: 'Arts', icon: 'palette', color: '#EC4899' },
];

// Quiz settings
export const QUIZ_CONFIG = {
  defaultTimePerQuestion: 60, // seconds
  minQuestionsPerQuiz: 5,
  maxQuestionsPerQuiz: 50,
  passingPercentage: 60,
};

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  excellent: 90,
  good: 75,
  average: 60,
  needsImprovement: 40,
};

// Animation durations (in ms)
export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};

export default APP_CONFIG;
