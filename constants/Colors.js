// AdaptEd Mind - Editorial Tech Design System
// Organic, muted palette with editorial typography

export const Colors = {
  // Primary colors - Teal (editorial accent)
  primary: '#3d7068',
  primaryLight: '#5a9e93',
  primaryDark: '#2b5049',

  // Secondary colors - Muted Emerald
  secondary: '#4a8c7e',
  secondaryLight: '#6eb0a2',
  secondaryDark: '#2f6558',

  // Accent colors - Warm Amber (muted)
  accent: '#c49a3c',
  accentLight: '#d4b56a',
  accentDark: '#9e7a2a',

  // Background colors — warm editorial
  background: '#f7f6f2',
  backgroundDark: '#1c1c1c',
  surface: '#FFFFFF',
  surfaceDark: '#2a2a28',

  // Text colors — editorial foreground
  text: '#1c1c1c',
  textLight: '#5a5a58',
  textMuted: '#9c9b96',
  textOnPrimary: '#FFFFFF',
  textDark: '#f0efeb',

  // Status colors (slightly muted)
  success: '#4a8c7e',
  warning: '#c49a3c',
  error: '#c45c4a',
  info: '#4a7a9c',

  // Card colors — editorial borders
  card: '#FFFFFF',
  cardBorder: '#e5e4de',
  cardShadow: 'rgba(28, 28, 28, 0.04)',

  // Gradient presets
  gradients: {
    primary: ['#3d7068', '#4a8c7e'],
    secondary: ['#4a8c7e', '#5a9e93'],
    accent: ['#c49a3c', '#d4b56a'],
    progress: ['#3d7068', '#4a8c7e'],
    warmth: ['#c49a3c', '#c45c4a'],
    cool: ['#4a7a9c', '#3d7068'],
  },

  // Subject-specific colors (muted editorial palette)
  subjects: {
    c_programming: '#3d7068',
    data_structures: '#4a8c7e',
    oop: '#c49a3c',
    dbms: '#6b6ea0',
    os: '#5a9e93',
    networks: '#4a7a9c',
    software_eng: '#c45c4a',
    web_tech: '#b07040',
    comp_org: '#5a8c6e',
    discrete_math: '#9c6a8c',
    algorithms: '#4a8ca0',
    ai: '#7a6aa0',
    ml: '#9c5aa0',
    cloud: '#4a909c',
    cyber: '#a04040',
    mobile_dev: '#4a8c5a',
    big_data: '#9c8a3c',
    data_science: '#6a5aa0',
  },
};

// Font families — editorial trio
export const Fonts = {
  // Playfair Display — Serif for headings and emotional impact
  heading: 'PlayfairDisplay_400Regular',
  headingRegular: 'PlayfairDisplay_400Regular',
  headingBold: 'PlayfairDisplay_700Bold',
  // Space Grotesk — Sans for readability (body text)
  body: 'SpaceGrotesk_400Regular',
  bodyMedium: 'SpaceGrotesk_500Medium',
  bodySemiBold: 'SpaceGrotesk_600SemiBold',
  bodyBold: 'SpaceGrotesk_700Bold',
  // Space Mono — Monospace for technical data, labels, and buttons
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
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
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
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
    shadowColor: '#1c1c1c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#1c1c1c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#1c1c1c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};

export default Colors;
