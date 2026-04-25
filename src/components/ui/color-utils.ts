/**
 * Color Utility Functions
 *
 * This file provides centralized color utilities to ensure consistent
 * color usage across the app, especially on Android where color rendering
 * can differ from iOS.
 */

import { Platform } from 'react-native';
import colors from './colors';

/**
 * Platform-specific color adjustments
 * Some colors need slight adjustments on Android for better visibility
 * due to differences in color space and rendering between platforms
 */
const PLATFORM_COLOR_ADJUSTMENTS: Record<string, Record<string, string>> = {
  android: {
    // Blue colors - slightly darker on Android for better visibility
    'blue.500': '#2563EB', // Slightly darker than #3B82F6
    'blue.400': '#60A5FA', // Slightly darker than #60A5FA
    'blue.50': '#DBEAFE', // Slightly darker than #EFF6FF

    // Gray colors - adjusted for better contrast on Android
    'gray.200': '#E5E7EB',
    'gray.300': '#D1D5DB',
    'gray.400': '#9CA3AF',
    'gray.500': '#6B7280',

    // Warning colors - slightly more saturated on Android
    'warning.500': '#D97706',
    'warning.50': '#FEF3C7',
    'warning.200': '#FDE68A',

    // Success colors - adjusted for better visibility
    'success.500': '#16A34A',
    'success.600': '#15803D',
    'success.50': '#DCFCE7',

    // Danger colors - adjusted for better visibility
    'danger.500': '#DC2626',
    'danger.600': '#B91C1C',
    'danger.50': '#FEE2E2',

    // Indigo colors - adjusted for consistency
    'indigo.500': '#4F46E5',
    'indigo.50': '#E0E7FF',
  },
  ios: {},
};

/**
 * Get a color value with platform-specific adjustments if needed
 * This ensures colors render consistently across iOS and Android
 */
export function getColor(colorKey: string, shade?: number | string): string {
  const keys = colorKey.split('.');
  let value: any = colors;

  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Color not found: ${colorKey}`);
      return colors.black;
    }
  }

  if (shade !== undefined && typeof value === 'object') {
    value = value[shade];
    if (value === undefined) {
      console.warn(`Color shade not found: ${colorKey}.${shade}`);
      return colors.black;
    }
  }

  return value as string;
}

/**
 * Platform-specific color adjustments
 * Some colors need slight adjustments on Android for better visibility
 */
export function getPlatformColor(
  colorKey: string,
  shade?: number | string,
  androidOverride?: string,
): string {
  // First check if there's an explicit override
  if (Platform.OS === 'android' && androidOverride) {
    return androidOverride;
  }

  // Then check for platform-specific adjustments
  const platform = Platform.OS as 'android' | 'ios';
  const colorKeyWithShade = shade ? `${colorKey}.${shade}` : colorKey;
  const platformAdjustments = PLATFORM_COLOR_ADJUSTMENTS[platform];

  if (platformAdjustments && platformAdjustments[colorKeyWithShade]) {
    return platformAdjustments[colorKeyWithShade];
  }

  // Fall back to default color
  return getColor(colorKey, shade);
}

/**
 * Common color shortcuts for frequently used colors
 * These automatically use platform-aware colors for consistency
 */
export const Color = {
  // Primary colors
  primary: (shade: number | string = 500) => getPlatformColor('primary', shade),
  blue: (shade: number | string = 500) => getPlatformColor('blue', shade),
  indigo: (shade: number | string = 500) => getPlatformColor('indigo', shade),

  // Semantic colors
  success: (shade: number | string = 500) => getPlatformColor('success', shade),
  warning: (shade: number | string = 500) => getPlatformColor('warning', shade),
  danger: (shade: number | string = 500) => getPlatformColor('danger', shade),
  error: (shade: number | string = 500) => getPlatformColor('danger', shade),

  // Neutral colors
  white: () => colors.white,
  black: () => colors.black,
  gray: (shade: number | string = 500) => getPlatformColor('gray', shade),
  neutral: (shade: number | string = 500) => getPlatformColor('neutral', shade),
  charcoal: (shade: number | string = 500) => getPlatformColor('charcoal', shade),

  // Text colors
  text: {
    primary: () => colors.text.primary,
    secondary: () => colors.text.secondary,
    tertiary: () => colors.text.tertiary,
    inverse: () => colors.text.inverse,
    muted: () => colors.text.muted,
  },

  // Background colors
  background: {
    light: () => colors.background.light,
    dark: () => colors.background.dark,
    surface: () => colors.background.surface,
    elevated: () => colors.background.elevated,
  },

  // Border colors
  border: {
    light: () => colors.border.light,
    dark: () => colors.border.dark,
    focus: () => colors.border.focus,
    error: () => colors.border.error,
  },

  // Status colors
  status: {
    present: () => colors.status.present,
    absent: () => colors.status.absent,
    excused: () => colors.status.excused,
    notMarked: () => colors.status.notMarked,
    draft: () => colors.status.draft,
    active: () => colors.status.active,
    closed: () => colors.status.closed,
  },

  // Avatar colors
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

  // Semantic shortcuts
  info: (shade: number | string = 500) => getPlatformColor('blue', shade),
  critical: (shade: number | string = 500) => getPlatformColor('danger', shade),
};

/**
 * Color with opacity helper
 * Adds transparency to a hex color
 */
export function withOpacity(hex: string, opacity: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Lighten a hex color
 */
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

/**
 * Darken a hex color
 */
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

/**
 * Get contrast color (black or white) based on background
 */
export function getContrastColor(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? colors.black : colors.white;
}

export default colors;
