import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

// Sizes are designed for a 390 pt wide phone and scaled moderately to the device: small phones
// shrink slightly and tablets grow slightly (capped) instead of looking tiny or oversized.
const BASE_WIDTH = 390;
const shortSide = Math.min(width, height);
const deviceScale = Math.min(Math.max(1 + (shortSide / BASE_WIDTH - 1) * 0.5, 0.9), 1.2);

/** Scales a font size or a fixed dimension designed for a 390 pt wide phone to the current device. */
export const scale = (size) => Math.round(size * deviceScale);

export const isTablet = shortSide >= 600;

export const colors = {
  // Brand palette
  primary: '#ffffff',
  primaryBis: '#f1f1f1',
  secondary: '#1c1c1c',
  lightGray: '#b2b2b2',
  darkGray: '#4A4A4A',
  darkblue: '#00407A',
  lightblue: '#4A90E2',
  lightGreen: '#3CB371',
  darkGreen: '#2E8B57',
  red: '#cc0000',
  lightOrange: '#FFA500',
  darkOrange: '#FF8C00',
  lightTeal: '#66cccc',
  darkTeal: '#006666',
  black: '#000000',

  // Semantic roles: use these to keep the UI consistent.
  background: '#f1f1f1',
  surface: '#ffffff',
  text: '#1c1c1c',
  textSecondary: '#4A4A4A',
  textMuted: '#8a8a8a',
  textOnColor: '#ffffff',
  border: '#e2e2e2',
  // Outline of form fields (Paper inputs and custom selectors share it).
  outline: '#9e9e9e',
  // Green: main action buttons (submit, continue, "Got it!").
  action: '#2E8B57',
  // Blue: navigation and selection (active tab, selected chips, links, focused inputs).
  accent: '#00407A',
  accentSoft: 'rgba(0, 64, 122, 0.1)',
  danger: '#cc0000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  // Background shown behind remote images while they load or when they fail offline.
  placeholder: '#e2e2e2',
};

export const fonts = {
  regular: 'Montserrat',
  bold: 'MontserratBold',
};

export const shadow = {
  light: {
    shadowColor: colors.black,
    shadowRadius: 4,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  dark: {
    shadowColor: colors.black,
    shadowRadius: 4,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
  },
  // Cards and floating elements (tab bar, dialogs).
  soft: {
    shadowColor: colors.black,
    shadowRadius: 16,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
};

export const sizes = {
  width,
  height,
  // Type scale (responsive): screen titles → headings → body → captions.
  title: scale(28),
  h1: scale(24),
  h2: scale(20),
  h3: scale(17),
  body: scale(15),
  h4: scale(14),
  h5: scale(12),
  small: scale(11),
  radius: 16,
  buttonRadius: 50,
  gauge: 8,
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 18,
  l: 24,
  xl: 40,
};

export const layout = {
  // Forms and reading content keep a comfortable width on tablets instead of stretching edge to edge.
  maxContentWidth: 560,
  minTouchTarget: 48,
};

const lineHeight = (fontSize) => Math.round(fontSize * 1.3);

// Montserrat has tall built-in padding on Android; removing it keeps text vertically centered.
const androidTextFix = Platform.OS === 'android' ? { includeFontPadding: false } : null;

/** Ready-made text styles; spread them and override only what differs. */
export const typography = StyleSheet.create({
  title: { fontFamily: fonts.regular, fontSize: sizes.title, lineHeight: lineHeight(sizes.title), color: colors.text },
  h1: { fontFamily: fonts.bold, fontSize: sizes.h1, lineHeight: lineHeight(sizes.h1), color: colors.text },
  h2: { fontFamily: fonts.bold, fontSize: sizes.h2, lineHeight: lineHeight(sizes.h2), color: colors.text },
  h3: { fontFamily: fonts.bold, fontSize: sizes.h3, lineHeight: lineHeight(sizes.h3), color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: sizes.body, lineHeight: Math.round(sizes.body * 1.45), color: colors.text },
  bodySmall: { fontFamily: fonts.regular, fontSize: sizes.h4, lineHeight: lineHeight(sizes.h4), color: colors.textSecondary },
  caption: { fontFamily: fonts.regular, fontSize: sizes.h5, lineHeight: lineHeight(sizes.h5), color: colors.textSecondary },
  button: { fontFamily: fonts.bold, fontSize: sizes.body, lineHeight: lineHeight(sizes.body), ...androidTextFix },
});

/** Centers a block of content and caps its width on tablets. */
export const contentWidth = {
  width: '100%',
  maxWidth: layout.maxContentWidth,
  alignSelf: 'center',
};

// Soft tints (14% of a brand color) behind icons and tiles, so a color accent stays gentle.
export const tints = {
  blue: 'rgba(74, 144, 226, 0.14)',
  green: 'rgba(46, 139, 87, 0.14)',
  orange: 'rgba(255, 140, 0, 0.14)',
  teal: 'rgba(0, 102, 102, 0.12)',
};

// Dark fade at the bottom of image cards, so text on a photo stays readable.
export const scrim = ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.78)'];

// Quiz gamification palette: XP (gold), streak (flame), badge tiers and confetti.
export const rewardColors = {
  xp: '#F5A623',
  xpSoft: 'rgba(245, 166, 35, 0.16)',
  streak: '#FF7A00',
  streakSoft: 'rgba(255, 122, 0, 0.14)',
  correctSoft: 'rgba(46, 139, 87, 0.12)',
  wrongSoft: 'rgba(204, 0, 0, 0.1)',
  correctPanel: '#E6F4EC',
  wrongPanel: '#FBE9E9',
  level: ['#4A90E2', '#00407A'],
  bronze: ['#FFCC80', '#C77C3B'],
  silver: ['#ECEFF1', '#90A4AE'],
  gold: ['#FFE082', '#F9A825'],
  locked: ['#EEEEEE', '#BDBDBD'],
  confetti: ['#2E8B57', '#00407A', '#F5A623', '#FF7A00', '#66cccc', '#E91E63', '#4A90E2'],
};

// Learning path identity (gradient pairs from the brand palette), keyed by the API path key.
export const pathColors = {
  follower: [colors.lightblue, colors.darkblue],
  explorer: [colors.lightTeal, colors.darkTeal],
  deep_learner: [colors.lightGreen, colors.darkGreen],
  researcher: [colors.lightOrange, colors.darkOrange],
  none: [colors.lightGray, colors.darkGray],
};

// Virtual lab map: the ground, and one palette per region (rim of the top face, side wall, island).
export const labColors = {
  ground: '#e7edf2',
  haze: 'rgba(231, 237, 242, 0.8)',
  hazeClear: 'rgba(231, 237, 242, 0)',
  grid: 'rgba(0, 64, 122, 0.1)',
  face: '#ffffff',
  shadow: 'rgba(28, 28, 28, 0.17)',
  muted: { rim: '#cbd2d9', side: '#b3bcc5', face: '#f1f3f5' },
  regions: {
    health: { rim: '#3CB371', side: '#2E8B57', island: '#d9eee3' },
    life: { rim: '#3fb0b0', side: '#00706f', island: '#d2eeee' },
    science: { rim: '#4A90E2', side: '#00407A', island: '#d9e6f5' },
    society: { rim: '#FFA500', side: '#C77400', island: '#fbe7c9' },
  },
};
