import * as React from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import colors from '@/components/ui/colors';

/**
 * AuthShell — the single dark surface used by every auth screen
 * (login, signup, OTP, reset, parent invite). Per visual-auth.md.
 *
 * Layers, back-to-front:
 *   1. Solid `colors.neutral.bg` canvas
 *   2. Brand-green glow blob anchored bottom-center
 *   3. Brand-blue glow blob anchored top-end
 *   4. Children (logo, hero, form, CTAs)
 *
 * `react-native-svg` is used to fake the radial-blur look. It is more
 * faithful than stacked `View` shadows on Android, and avoids the native
 * `expo-blur` dependency which is overkill for a static decorative glow.
 */

type AuthShellProps = {
  children: React.ReactNode;
  testID?: string;
};

const SCREEN_GLOW_GREEN = {
  cx: '50%',
  cy: '85%',
  r: '55%',
  color: colors.brand.primary,
  opacity: 0.28,
} as const;

const SCREEN_GLOW_BLUE = {
  cx: '88%',
  cy: '8%',
  r: '38%',
  color: colors.brand.blue,
  opacity: 0.22,
} as const;

export function AuthShell({ children, testID }: AuthShellProps) {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.neutral.bg }}
      edges={['top', 'bottom', 'left', 'right']}
      testID={testID}
    >
      {/* Glow layer — absolute, non-interactive */}
      <View
        pointerEvents="none"
        style={{
          ...Platform.select({
            ios: { position: 'absolute' },
            android: { position: 'absolute' },
            default: { position: 'absolute' },
          }),
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient
              id="glowGreen"
              cx={SCREEN_GLOW_GREEN.cx}
              cy={SCREEN_GLOW_GREEN.cy}
              rx={SCREEN_GLOW_GREEN.r}
              ry={SCREEN_GLOW_GREEN.r}
            >
              <Stop offset="0" stopColor={SCREEN_GLOW_GREEN.color} stopOpacity={SCREEN_GLOW_GREEN.opacity} />
              <Stop offset="1" stopColor={SCREEN_GLOW_GREEN.color} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient
              id="glowBlue"
              cx={SCREEN_GLOW_BLUE.cx}
              cy={SCREEN_GLOW_BLUE.cy}
              rx={SCREEN_GLOW_BLUE.r}
              ry={SCREEN_GLOW_BLUE.r}
            >
              <Stop offset="0" stopColor={SCREEN_GLOW_BLUE.color} stopOpacity={SCREEN_GLOW_BLUE.opacity} />
              <Stop offset="1" stopColor={SCREEN_GLOW_BLUE.color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#glowGreen)" />
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#glowBlue)" />
        </Svg>
      </View>
      {/* Content layer */}
      <View style={{ flex: 1 }}>{children}</View>
    </SafeAreaView>
  );
}
