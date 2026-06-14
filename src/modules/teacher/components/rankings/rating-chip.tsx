/**
 * RatingChip — 3-state primitive for session rankings.
 * unrated  → dashed track + em-dash
 * active 0 → solid lime fill + "0/10"
 * 1–10     → proportional lime fill + "N/10"
 */

import { View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type Props = {
  value: number | null;
  max?: number;
};

export function RatingChip({ value, max = 10 }: Props) {
  const isUnrated = value == null;
  const isZero = value === 0;

  if (isUnrated) {
    return (
      <View className="flex-row items-center gap-2">
        <View
          className="h-1.5 flex-1 rounded-full"
          style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.neutral.dim, opacity: 0.5 }}
        />
        <Text className="w-7 text-end text-caption font-bold" style={{ color: colors.neutral.inkMuted }}>
          —
        </Text>
      </View>
    );
  }

  const pct = isZero ? 100 : ((value as number) / max) * 100;
  const fillColor = isZero ? colors.brand.primary : colors.neutral.ink;

  return (
    <View className="flex-row items-center gap-2">
      <View className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: colors.neutral.rule }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: fillColor, borderRadius: 999 }} />
      </View>
      <Text className="w-7 text-end text-caption font-bold" style={{ color: colors.neutral.ink }}>
        {value}
        <Text className="text-micro" style={{ color: colors.neutral.inkMuted }}>
          /
          {max}
        </Text>
      </Text>
    </View>
  );
}
