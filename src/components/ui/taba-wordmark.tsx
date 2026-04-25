import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import colors from '@/components/ui/colors';

type TabaWordmarkProps = {
  size?: number;
  color?: string;
  gradientThree?: boolean;
  testID?: string;
};

function TabaWordmark({
  size = 22,
  color = colors.neutral.ink,
  gradientThree = false,
  testID,
}: TabaWordmarkProps) {
  if (!gradientThree) {
    return (
      <Text style={[styles.text, { fontSize: size, color }]} testID={testID}>
        Taba3ny
      </Text>
    );
  }

  return (
    <View style={styles.row} testID={testID}>
      <Text style={[styles.text, { fontSize: size, color }]}>Taba</Text>
      <Text style={[styles.text, { fontSize: size, color: colors.brand.primary }]}>3</Text>
      <Text style={[styles.text, { fontSize: size, color }]}>ny</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: '700',
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
});

export { TabaWordmark };
