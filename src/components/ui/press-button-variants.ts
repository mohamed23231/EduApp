import colors from '@/components/ui/colors';

/**
 * PressButton variant + size style maps.
 *
 * Extracted from `press-button.tsx` so the primitive stays under the 300-line
 * cap. `variant` is the visual contract per `contracts/visual-<role>.md`:
 * it owns background, text color, shadow, border. The `gradient` variant has
 * `background: null` — the LinearGradient overlay renderer takes over and the
 * green-glow shadow recipe comes from `contracts/visual-auth.md`.
 */

export type PressButtonVariant
  = | 'primary' // ink fill, white text — paper surfaces
    | 'accent' // brand green, ink text — "Live"/CTA on dark
    | 'gradient' // brand blue→green gradient — auth + welcome CTAs
    | 'secondary' // paper card, ink text, hairline border
    | 'ghost' // transparent, ink text — tertiary actions on paper
    | 'darkGhost' // 8%-white fill on dark — secondary on auth/hero
    | 'danger' // semantic absent — destructive actions
    | 'success'; // semantic present — confirmations

export type PressButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export type PressButtonSizeStyle = {
  height: number;
  paddingX: number;
  fontSize: number;
  radius: number;
  iconGap: number;
};

export const SIZES: Record<PressButtonSize, PressButtonSizeStyle> = {
  sm: { height: 40, paddingX: 16, fontSize: 13, radius: 10, iconGap: 6 },
  md: { height: 52, paddingX: 22, fontSize: 15, radius: 14, iconGap: 8 },
  lg: { height: 60, paddingX: 26, fontSize: 16, radius: 18, iconGap: 8 },
  xl: { height: 68, paddingX: 28, fontSize: 17, radius: 20, iconGap: 10 },
};

export type VariantStyle = {
  background: string | null; // null = gradient renderer takes over
  textColor: string;
  border: string | null;
  shadowColor: string | null;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffsetY: number;
};

export const VARIANTS: Record<PressButtonVariant, VariantStyle> = {
  primary: {
    background: colors.neutral.ink,
    textColor: colors.neutral.white,
    border: null,
    shadowColor: colors.neutral.ink,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffsetY: 6,
  },
  accent: {
    background: colors.brand.primary,
    textColor: colors.brand.primaryInk,
    border: null,
    shadowColor: colors.brand.primary,
    shadowOpacity: 0.42,
    shadowRadius: 24,
    shadowOffsetY: 8,
  },
  gradient: {
    // green-glow recipe per contracts/visual-auth.md "Primary CTA":
    // shadowColor brand.primary, opacity 0.35, radius 40, offset {0,12}.
    background: null, // LinearGradient overlay
    textColor: colors.neutral.white,
    border: null,
    shadowColor: colors.brand.primary,
    shadowOpacity: 0.35,
    shadowRadius: 40,
    shadowOffsetY: 12,
  },
  secondary: {
    background: colors.neutral.card,
    textColor: colors.neutral.ink,
    border: colors.neutral.rule,
    shadowColor: null,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffsetY: 0,
  },
  ghost: {
    background: 'transparent',
    textColor: colors.neutral.ink,
    border: null,
    shadowColor: null,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffsetY: 0,
  },
  darkGhost: {
    background: 'rgba(255,255,255,0.08)',
    textColor: colors.neutral.white,
    border: 'rgba(255,255,255,0.15)',
    shadowColor: null,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffsetY: 0,
  },
  danger: {
    background: colors.semantic.absent,
    textColor: colors.neutral.white,
    border: null,
    shadowColor: colors.semantic.absent,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffsetY: 6,
  },
  success: {
    background: colors.semantic.present,
    textColor: colors.neutral.white,
    border: null,
    shadowColor: colors.semantic.present,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffsetY: 6,
  },
};

/** Disabled gradient/accent fade to a muted dark fill on dark canvases. */
export const DISABLED_FILL = 'rgba(255,255,255,0.10)';
