// AdaptEd Mind - Color Palette
// Student-friendly, pleasant, and eye-friendly colors

export const Colors = {
  // Primary colors - Indigo (calming, focused)
  primary: '#6366F1',
  primaryLight: '#A5B4FC',
  primaryDark: '#4338CA',
  
  // Secondary colors - Emerald (success, growth)
  secondary: '#10B981',
  secondaryLight: '#6EE7B7',
  secondaryDark: '#047857',
  
  // Accent colors - Amber (highlights, attention)
  accent: '#F59E0B',
  accentLight: '#FCD34D',
  accentDark: '#D97706',
  
  // Background colors
  background: '#F8FAFC',
  backgroundDark: '#1E293B',
  surface: '#FFFFFF',
  surfaceDark: '#334155',
  
  // Text colors
  text: '#1E293B',
  textLight: '#64748B',
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',
  textDark: '#F1F5F9',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Card colors
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  cardShadow: 'rgba(0, 0, 0, 0.05)',
  
  // Gradient presets
  gradients: {
    primary: ['#6366F1', '#8B5CF6'],
    secondary: ['#10B981', '#14B8A6'],
    accent: ['#F59E0B', '#F97316'],
    progress: ['#6366F1', '#10B981'],
    warmth: ['#F59E0B', '#EF4444'],
    cool: ['#3B82F6', '#6366F1'],
  },
  
  // Subject-specific colors (for visual differentiation)
  subjects: {
    math: '#6366F1',
    science: '#10B981',
    english: '#F59E0B',
    history: '#8B5CF6',
    geography: '#14B8A6',
    physics: '#3B82F6',
    chemistry: '#EF4444',
    biology: '#22C55E',
    computer: '#6B7280',
    arts: '#EC4899',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

export const FontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

export default Colors;
