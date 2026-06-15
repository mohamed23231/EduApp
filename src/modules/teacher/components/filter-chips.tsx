/**
 * FilterChips
 * Horizontal scrollable chip bar for filtering lists.
 * Animated selection with spring physics.
 */

import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

export type FilterOption<T extends string = string> = {
  key: T;
  label: string;
  count?: number;
};

type FilterChipsProps<T extends string = string> = {
  options: FilterOption<T>[];
  selected: T;
  onSelect: (key: T) => void;
};

function Chip<T extends string>({
  option,
  isActive,
  onPress,
}: {
  option: FilterOption<T>;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(0.93, { damping: 15 });
  };

  const handlePressOut = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.chip, isActive && styles.chipActive]}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={option.label}
      >
        <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
          {option.label}
        </Text>
        {option.count !== undefined
          ? (
              <View style={[styles.badge, isActive && styles.badgeActive]}>
                <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                  {option.count}
                </Text>
              </View>
            )
          : null}
      </Pressable>
    </Animated.View>
  );
}

export function FilterChips<T extends string = string>({
  options,
  selected,
  onSelect,
}: FilterChipsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {options.map(option => (
        <Chip
          key={option.key}
          option={option}
          isActive={option.key === selected}
          onPress={() => onSelect(option.key)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flexGrow: 0 },
  container: { paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.neutral.card,
    borderWidth: 1,
    borderColor: colors.neutral.rule,
    gap: 6,
  },
  chipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.neutral.inkSoft },
  chipTextActive: { color: colors.brand.primaryInk },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.neutral.cardWarm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeActive: { backgroundColor: 'rgba(11,13,16,0.12)' },
  badgeText: { fontSize: 11, fontWeight: '600', color: colors.neutral.inkMuted },
  badgeTextActive: { color: colors.brand.primaryInk },
});
