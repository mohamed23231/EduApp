import * as React from 'react';
import { Text, View } from 'react-native';
import { GradientText } from '@/components/ui';
import colors from '@/components/ui/colors';

/**
 * Shared dark-shell hero: white first line, brand-gradient second line, dim
 * subhead. Per `visual-auth.md`. Extracted from the auth view files so each
 * stays under the 300-line cap and the hero treatment stays consistent.
 */

export type AuthHeroProps = {
  line1: string;
  line2: string;
  subtitle: string;
  isRTL: boolean;
  size?: number;
  marginTop?: number;
};

export function AuthHero({ line1, line2, subtitle, isRTL, size = 32, marginTop = 32 }: AuthHeroProps) {
  return (
    <View style={{ paddingHorizontal: 24, marginTop }}>
      <Text
        style={{
          color: colors.neutral.white,
          fontSize: size,
          lineHeight: size + 4,
          fontWeight: '700',
          letterSpacing: -1.2,
          textAlign: isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        }}
      >
        {line1}
      </Text>
      <View style={{ marginTop: 2, alignSelf: isRTL ? 'flex-end' : 'flex-start' }}>
        <GradientText size={size} weight="700">
          {line2}
        </GradientText>
      </View>
      <Text
        style={{
          color: colors.neutral.dim,
          fontSize: 14,
          lineHeight: 22,
          fontWeight: '500',
          marginTop: 12,
          textAlign: isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
}
