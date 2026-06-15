/**
 * Rankings rows — leaderboard rank row + not-yet-rated row.
 * Extracted from session-rankings-screen to keep the screen under the cap.
 */

import type { RankedStudent } from '../../types';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { DeltaChip } from './delta-chip';
import { RatingChip } from './rating-chip';

function RankCircle({ idx, highlight }: { idx: number; highlight: boolean }) {
  return (
    <View
      className="size-6 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: highlight ? colors.brand.primary : colors.neutral.paper }}
    >
      <Text className="text-caption font-bold text-ink">{idx}</Text>
    </View>
  );
}

function RankMonogram({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return (
    <View
      className="size-9 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: colors.neutral.ink }}
    >
      <Text className="text-body font-bold" style={{ color: '#fff' }}>{initials}</Text>
    </View>
  );
}

type RankRowProps = {
  idx: number;
  row: RankedStudent;
  highlight: boolean;
  onPress: () => void;
};

export function RankRow({ idx, row, highlight, onPress }: RankRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-2xl border p-3"
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? colors.neutral.paper : colors.neutral.card,
          borderColor: highlight ? colors.brand.primary : colors.neutral.rule,
          borderWidth: 1.5,
        },
      ]}
    >
      <RankCircle idx={idx} highlight={highlight} />
      <RankMonogram name={row.studentName} />
      <View className="min-w-0 flex-1">
        <View className="mb-1 flex-row items-center gap-1.5">
          <Text className="shrink text-[14px] font-bold text-ink" numberOfLines={1}>
            {row.studentName}
          </Text>
          <DeltaChip trend={row.trend} />
        </View>
        <RatingChip value={row.averageRating} />
      </View>
    </Pressable>
  );
}

type UnratedRowProps = {
  name: string;
  label: string;
  onPress: () => void;
};

export function UnratedRow({ name, label, onPress }: UnratedRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-2xl p-3"
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? colors.neutral.paper : colors.neutral.card,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: colors.neutral.rule,
        },
      ]}
    >
      <View className="w-6 items-center">
        <Text className="text-caption font-bold text-ink-muted">—</Text>
      </View>
      <RankMonogram name={name} />
      <View className="min-w-0 flex-1">
        <Text className="text-[14px] font-bold text-ink" numberOfLines={1}>{name}</Text>
        <Text className="mt-0.5 text-caption text-ink-muted">{label}</Text>
      </View>
    </Pressable>
  );
}
