module.exports = {
  // Brand
  brand: {
    primary: '#22C572',
    primaryDeep: '#0E8B4F',
    primaryInk: '#FFFFFF',
    primaryGlow: 'rgba(34, 197, 114, 0.42)',
    blue: '#2D7DE0',
    blueDeep: '#1B5BB8',
  },

  // Neutral
  neutral: {
    ink: '#0B0D10',
    bg: '#0B0D10',
    bgElev: '#14171C',
    paper: '#F5F5F0',
    card: '#FFFFFF',
    cardWarm: '#F5F2EA',
    rule: '#E6E3DB',
    ruleDark: '#23272E',
    inkSoft: '#3A3F47',
    inkMuted: '#5C636E',
    dim: '#C7CBD3',
    white: '#FFFFFF',
    // Legacy numeric scale (consumed by unmigrated screens via colors.neutral[400] etc.)
    // eslint-disable-next-line style/quote-props
    '50': '#FAFAFA',
    // eslint-disable-next-line style/quote-props
    '100': '#F5F5F5',
    // eslint-disable-next-line style/quote-props
    '200': '#F0EFEE',
    // eslint-disable-next-line style/quote-props
    '300': '#D4D4D4',
    // eslint-disable-next-line style/quote-props
    '400': '#A3A3A3',
    // eslint-disable-next-line style/quote-props
    '500': '#737373',
    // eslint-disable-next-line style/quote-props
    '600': '#525252',
    // eslint-disable-next-line style/quote-props
    '700': '#404040',
    // eslint-disable-next-line style/quote-props
    '800': '#262626',
    // eslint-disable-next-line style/quote-props
    '900': '#171717',
  },

  // Semantic
  semantic: {
    present: '#00C2A0',
    presentSoft: '#CCF1E7',
    presentInk: '#00493A',
    absent: '#FF5B4A',
    absentSoft: '#FFE1DD',
    absentInk: '#7A1C10',
    excused: '#FFB020',
    excusedSoft: '#FFF0D5',
    excusedInk: '#7A4E00',
    info: '#3D7FFF',
    infoSoft: '#DCE8FF',
  },

  // Radii
  radii: {
    r1: 8,
    r2: 12,
    r3: 18,
    r4: 24,
    r5: 32,
  },

  // Typography
  typography: {
    ui: '"Geist", "Inter", -apple-system, "SF Pro Display", system-ui, sans-serif',
    display: '"Geist", "Inter", -apple-system, "SF Pro Display", system-ui, sans-serif',
    numeric: '"Geist", "Inter", -apple-system, "SF Pro Display", system-ui, sans-serif',
    arabic: '"Rubik", "SF Arabic", system-ui, sans-serif',
  },

  // Motion
  motion: {
    durations: { instant: 0, fast: 150, base: 250, slow: 600, logoIntro: 1400 },
    easings: {
      standard: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
      accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
      decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      emphasized: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
    },
  },

  // Z-index
  zIndex: {
    base: 0,
    raised: 10,
    sticky: 20,
    navigation: 30,
    tabBar: 40,
    toast: 50,
    offlineBanner: 100,
    sheet: 180,
    confirmSheet: 200,
    modal: 300,
  },

  // Type scale
  typeScale: {
    micro: { size: 10, lineHeight: 1.4, weight: 700, letterSpacing: 1.5, uppercase: true },
    caption: { size: 11, lineHeight: 1.4, weight: 500 },
    small: { size: 12, lineHeight: 1.45, weight: 500 },
    body: { size: 13, lineHeight: 1.5, weight: 500 },
    bodyLg: { size: 15, lineHeight: 1.5, weight: 600 },
    title: { size: 18, lineHeight: 1.3, weight: 700, letterSpacing: -0.3 },
    headline: { size: 22, lineHeight: 1.2, weight: 700, letterSpacing: -0.5 },
    display: { size: 30, lineHeight: 1.1, weight: 700, letterSpacing: -1.0 },
    hero: { size: 34, lineHeight: 1.05, weight: 700, letterSpacing: -1.2 },
  },

  // Layout metrics
  layout: {
    maxPhoneWidth: 480,
    baseScreenWidth: 390,
  },

  // ========== LEGACY COMPAT (consumed by unmigrated screens) ==========
  // These will be removed in Phase C after all screens migrate.
  // New code MUST use brand/neutral/semantic tokens above.
  white: '#ffffff',
  black: '#000000',
  primary: {
    50: '#FFE2CC',
    100: '#FFC499',
    200: '#FFA766',
    300: '#FF984C',
    400: '#FF8933',
    500: '#FF7B1A',
    600: '#FF6C00',
    700: '#E56100',
    800: '#CC5600',
    900: '#B24C00',
  },
  charcoal: {
    50: '#F2F2F2',
    100: '#E5E5E5',
    200: '#C9C9C9',
    300: '#B0B0B0',
    400: '#969696',
    500: '#7D7D7D',
    600: '#616161',
    700: '#474747',
    800: '#383838',
    850: '#2E2E2E',
    900: '#1E1E1E',
    950: '#121212',
  },
  status: {
    present: '#00C2A0',
    absent: '#FF5B4A',
    excused: '#FFB020',
    notMarked: '#E4E6EB',
    draft: '#FFB020',
    active: '#22C572',
    closed: '#CCF1E7',
  },
  avatar: {
    indigo: '#6366F1',
    rose: '#F43F5E',
    teal: '#14B8A6',
    amber: '#F59E0B',
    violet: '#A855F7',
    sky: '#0EA5E9',
    lime: '#84CC16',
    present: '#00C2A0',
    absent: '#FF5B4A',
    excused: '#FFB020',
    ink: '#0B0D10',
  },
  avatarBg: {
    indigo: '#EEF2FF',
    rose: '#FFF1F2',
    teal: '#F0FDFA',
    amber: '#FFFBEB',
    violet: '#F5F3FF',
    sky: '#F0F9FF',
    lime: '#ECFCCB',
    present: '#CCF1E7',
    absent: '#FFE1DD',
    excused: '#FFF0D5',
    ink: '#0B0D10',
  },
  text: {
    primary: '#0B0D10',
    secondary: '#5C636E',
    tertiary: '#C7CBD3',
    inverse: '#FFFFFF',
    muted: '#5C636E',
  },
  background: {
    light: '#F5F5F0',
    dark: '#0B0D10',
    surface: '#F5F5F0',
    elevated: '#FFFFFF',
  },
  border: {
    light: '#E6E3DB',
    dark: '#23272E',
    focus: '#22C572',
    error: '#FF5B4A',
  },
};
