import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import colors from '@/components/ui/colors';

// TODO: Replace placeholder with actual Taba3ny logo SVG once provided by design.

type TabaMarkProps = {
  size?: number;
  frame?: 'none' | 'ink' | 'paper' | 'gradient' | 'white';
  boxed?: boolean;
  testID?: string;
};

const FRAME_COLORS: Record<NonNullable<TabaMarkProps['frame']>, string | undefined> = {
  none: undefined,
  ink: colors.neutral.ink,
  paper: colors.neutral.paper,
  gradient: colors.brand.primaryGlow,
  white: colors.neutral.card,
};

function TabaMark({ size = 48, frame = 'none', boxed = false, testID }: TabaMarkProps) {
  const frameColor = FRAME_COLORS[frame];

  const innerSize = boxed ? size * 0.55 : size * 0.85;
  const fontSize = innerSize * 0.6;

  return (
    <View
      style={[
        styles.outer,
        {
          width: size,
          height: size,
          borderRadius: boxed ? size * 0.22 : size / 2,
          backgroundColor: frameColor ?? 'transparent',
        },
        frame === 'none' && !boxed ? styles.noFrame : undefined,
      ]}
      testID={testID}
    >
      <View
        style={[
          styles.inner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}
      >
        <Text style={[styles.letter, { fontSize }]}>ت</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  noFrame: {
    backgroundColor: 'transparent',
  },
  inner: {
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: colors.neutral.card,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
});

export { TabaMark };
