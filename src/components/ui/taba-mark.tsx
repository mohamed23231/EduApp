import * as React from 'react';
import { Image, View } from 'react-native';
import colors from '@/components/ui/colors';
import { AppImages } from '@/components/ui/images';

/**
 * TabaMark — the Taba3ny brand mark (eye + growth arrow).
 *
 * Renders the WebP brand asset (`assets/taba-logo.webp` + @2x/@3x). The
 * `frame` prop wraps the mark in a contrasting chip per the visual contract:
 *   - none      — bare mark, no chip
 *   - ink       — dark obsidian chip with subtle blue glow (auth canvas)
 *   - paper     — paper chip with hairline border (paper canvas headers)
 *   - white     — pure white chip (used on gradient backgrounds)
 *   - gradient  — brand-glow tint chip (decorative)
 */

type TabaMarkFrame = 'none' | 'ink' | 'paper' | 'white' | 'gradient';

type TabaMarkProps = {
  size?: number;
  frame?: TabaMarkFrame;
  /**
   * Legacy prop — accepted for backwards compatibility with pre-WebP
   * call sites. Forces a square frame instead of the rounded one.
   */
  boxed?: boolean;
  testID?: string;
};

const FRAME_BG: Record<TabaMarkFrame, string | undefined> = {
  none: undefined,
  ink: colors.neutral.ink,
  paper: colors.neutral.card,
  white: colors.neutral.white,
  gradient: colors.brand.primaryGlow,
};

const FRAME_BORDER: Record<TabaMarkFrame, string | undefined> = {
  none: undefined,
  ink: undefined,
  paper: colors.neutral.rule,
  white: undefined,
  gradient: undefined,
};

export function TabaMark({ size = 48, frame = 'none', boxed = false, testID }: TabaMarkProps) {
  const bg = FRAME_BG[frame];
  const border = FRAME_BORDER[frame];
  const inset = frame === 'none' ? 0 : Math.round(size * 0.18);
  const innerSize = size - inset * 2;
  // Logo aspect is ~9:5 (Vector.png is 767×426). Compute height to preserve.
  const innerHeight = Math.round(innerSize * (426 / 767));

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: boxed ? Math.round(size * 0.18) : Math.round(size * 0.28),
        backgroundColor: bg ?? 'transparent',
        borderWidth: border ? 1.5 : 0,
        borderColor: border ?? 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        shadowColor: frame === 'ink' ? colors.brand.blue : undefined,
        shadowOpacity: frame === 'ink' ? 0.35 : 0,
        shadowRadius: frame === 'ink' ? 12 : 0,
        shadowOffset: frame === 'ink' ? { width: 0, height: 4 } : undefined,
      }}
      testID={testID}
    >
      <Image
        source={AppImages.brandMark}
        style={{
          width: innerSize,
          height: innerHeight,
        }}
        resizeMode="contain"
      />
    </View>
  );
}
