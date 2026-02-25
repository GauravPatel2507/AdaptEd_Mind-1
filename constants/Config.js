// App-wide configuration constants

// AI Configuration for Groq (SAFE — uses env variable)
export const AI_CONFIG = {
  GROQ_API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions',
  GROQ_MODEL: 'llama-3.3-70b-versatile',
};

export const APP_CONFIG = {
  name: 'AdaptEd Mind',
  version: '2.0.0',
  description: 'CS & MCA Learning Platform — Master CS. Build Your Future.',
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

// Learning subjects — Core CS/MCA Subjects
export const SUBJECTS = [
  // Core Subjects
  { id: 'c_programming', name: 'Programming in C', icon: 'code-slash', color: '#6366F1' },
  { id: 'data_structures', name: 'Data Structures', icon: 'git-branch', color: '#10B981' },
  { id: 'oop', name: 'OOP (Java/Python/C++)', icon: 'cube', color: '#F59E0B' },
  { id: 'dbms', name: 'Database Management', icon: 'server', color: '#8B5CF6' },
  { id: 'os', name: 'Operating Systems', icon: 'desktop', color: '#14B8A6' },
  { id: 'networks', name: 'Computer Networks', icon: 'globe', color: '#3B82F6' },
  { id: 'software_eng', name: 'Software Engineering', icon: 'construct', color: '#EF4444' },
  { id: 'web_tech', name: 'Web Technologies', icon: 'logo-html5', color: '#F97316' },
  { id: 'comp_org', name: 'Computer Organization', icon: 'hardware-chip', color: '#22C55E' },
  { id: 'discrete_math', name: 'Discrete Mathematics', icon: 'calculator', color: '#EC4899' },
  { id: 'algorithms', name: 'Design & Analysis of Algorithms', icon: 'analytics', color: '#0EA5E9' },
  // Elective / Advanced Subjects
  { id: 'ai', name: 'Artificial Intelligence', icon: 'sparkles', color: '#A855F7' },
  { id: 'ml', name: 'Machine Learning', icon: 'trending-up', color: '#D946EF' },
  { id: 'cloud', name: 'Cloud Computing', icon: 'cloud', color: '#06B6D4' },
  { id: 'cyber', name: 'Cyber Security', icon: 'shield-checkmark', color: '#DC2626' },
  { id: 'mobile_dev', name: 'Mobile App Development', icon: 'phone-portrait', color: '#16A34A' },
  { id: 'big_data', name: 'Big Data', icon: 'bar-chart', color: '#CA8A04' },
  { id: 'data_science', name: 'Data Science', icon: 'stats-chart', color: '#7C3AED' },
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
