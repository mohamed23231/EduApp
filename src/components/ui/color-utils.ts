import colors from './colors';

export function getColor(colorKey: string, shade?: number | string): string {
  const keys = colorKey.split('.');
  let value: unknown = colors;

  for (const key of keys) {
    if (value == null || typeof value !== 'object') {
      console.warn(`Color not found: ${colorKey}`);
      return colors.black;
    }
    value = (value as Record<string, unknown>)[key];
    if (value === undefined) {
      console.warn(`Color not found: ${colorKey}`);
      return colors.black;
    }
  }

  if (shade !== undefined && typeof value === 'object' && value !== null) {
    value = (value as Record<string | number, unknown>)[shade];
    if (value === undefined) {
      console.warn(`Color shade not found: ${colorKey}.${shade}`);
      return colors.black;
    }
  }

  return value as string;
}

export const Color = {
  brand: {
    primary: () => colors.brand.primary,
    primaryDeep: () => colors.brand.primaryDeep,
    blue: () => colors.brand.blue,
    blueDeep: () => colors.brand.blueDeep,
    glow: () => colors.brand.primaryGlow,
  },

  neutral: {
    ink: () => colors.neutral.ink,
    paper: () => colors.neutral.paper,
    card: () => colors.neutral.card,
    rule: () => colors.neutral.rule,
    inkSoft: () => colors.neutral.inkSoft,
    inkMuted: () => colors.neutral.inkMuted,
    dim: () => colors.neutral.dim,
  },

  semantic: {
    present: () => colors.semantic.present,
    presentSoft: () => colors.semantic.presentSoft,
    presentInk: () => colors.semantic.presentInk,
    absent: () => colors.semantic.absent,
    absentSoft: () => colors.semantic.absentSoft,
    absentInk: () => colors.semantic.absentInk,
    excused: () => colors.semantic.excused,
    excusedSoft: () => colors.semantic.excusedSoft,
    excusedInk: () => colors.semantic.excusedInk,
    info: () => colors.semantic.info,
    infoSoft: () => colors.semantic.infoSoft,
  },

  white: () => colors.white,
  black: () => colors.black,

  primary: (_shade?: number | string) => colors.brand.primary,
  blue: (_shade?: number | string) => colors.brand.blue,
  indigo: (_shade?: number | string) => colors.avatar.indigo,
  success: (_shade?: number | string) => colors.semantic.present,
  warning: (_shade?: number | string) => colors.semantic.excused,
  danger: (_shade?: number | string) => colors.semantic.absent,
  error: (_shade?: number | string) => colors.semantic.absent,
  gray: (_shade?: number | string) => colors.neutral.dim,
  charcoal: (_shade?: number | string) => colors.neutral.ink,
  info: (_shade?: number | string) => colors.semantic.info,
  critical: (_shade?: number | string) => colors.semantic.absent,

  text: {
    primary: () => colors.text.primary,
    secondary: () => colors.text.secondary,
    tertiary: () => colors.text.tertiary,
    inverse: () => colors.text.inverse,
    muted: () => colors.text.muted,
  },

  background: {
    light: () => colors.background.light,
    dark: () => colors.background.dark,
    surface: () => colors.background.surface,
    elevated: () => colors.background.elevated,
  },

  border: {
    light: () => colors.border.light,
    dark: () => colors.border.dark,
    focus: () => colors.border.focus,
    error: () => colors.border.error,
  },

  status: {
    present: () => colors.status.present,
    absent: () => colors.status.absent,
    excused: () => colors.status.excused,
    notMarked: () => colors.status.notMarked,
    draft: () => colors.status.draft,
    active: () => colors.status.active,
    closed: () => colors.status.closed,
  },

  avatar: {
    getColor: (index: number) => {
      const keys = Object.keys(colors.avatar) as Array<keyof typeof colors.avatar>;
      return colors.avatar[keys[index % keys.length]];
    },
    getBgColor: (index: number) => {
      const keys = Object.keys(colors.avatarBg) as Array<keyof typeof colors.avatarBg>;
      return colors.avatarBg[keys[index % keys.length]];
    },
  },
};

export function withOpacity(hex: string, opacity: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function lighten(hex: string, percent: number): string {
  const num = Number.parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  const result = 0x1000000
    + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000
    + (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100
    + (B < 255 ? (B < 1 ? 0 : B) : 255);
  return `#${result.toString(16).slice(1)}`;
}

export function darken(hex: string, percent: number): string {
  const num = Number.parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  const result = 0x1000000
    + (R > 0 ? R : 0) * 0x10000
    + (G > 0 ? G : 0) * 0x100
    + (B > 0 ? B : 0);
  return `#${result.toString(16).slice(1)}`;
}

export function getContrastColor(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? colors.black : colors.white;
}

export default colors;
