import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '@/components/ui/colors';
import { Text } from '@/components/ui/text';

type TopBarTone = 'light' | 'dark';

type TopBarProps = {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  tone?: TopBarTone;
  testID?: string;
};

const TONE_COLORS: Record<TopBarTone, { text: string; icon: string; bg: string }> = {
  light: {
    text: colors.neutral.ink,
    icon: colors.neutral.ink,
    bg: 'transparent',
  },
  dark: {
    text: colors.neutral.dim,
    icon: colors.neutral.paper,
    bg: colors.neutral.ink,
  },
};

export function TopBar({
  title,
  onBack,
  right,
  tone = 'light',
  testID,
}: TopBarProps) {
  const insets = useSafeAreaInsets();
  const palette = TONE_COLORS[tone];

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top, backgroundColor: palette.bg }]} testID={testID}>
      <View style={styles.row}>
        <View style={styles.left}>
          {onBack
            ? (
                <Pressable
                  onPress={onBack}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                  style={styles.backButton}
                >
                  <Ionicons name="chevron-back" size={24} color={palette.icon} />
                </Pressable>
              )
            : null}
        </View>

        <View style={styles.center}>
          {title
            ? (
                <Text style={[styles.title, { color: palette.text }]} numberOfLines={1}>
                  {title}
                </Text>
              )
            : null}
        </View>

        <View style={styles.right}>{right ?? null}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%' as const,
  },
  row: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  left: {
    minWidth: 40,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    minWidth: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
});
