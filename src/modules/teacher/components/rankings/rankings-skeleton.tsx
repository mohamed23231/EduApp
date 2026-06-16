/**
 * RankingsSkeleton — loading placeholder for the session leaderboard.
 * Mirrors the ink hero + grouped rank rows so the layout doesn't jump.
 */

import { View } from 'react-native';
import { Skeleton } from '@/components/ui';
import colors from '@/components/ui/colors';

function RankRowSkeleton() {
  return (
    <View
      className="flex-row items-center gap-3 rounded-2xl border border-rule p-3"
      style={{ backgroundColor: colors.neutral.card }}
    >
      <Skeleton width={24} height={24} radius={12} />
      <Skeleton width={36} height={36} radius={18} />
      <View className="flex-1 gap-2">
        <Skeleton width="60%" height={14} />
        <Skeleton width="35%" height={12} />
      </View>
    </View>
  );
}

export function RankingsSkeleton({ count = 5 }: { count?: number }) {
  const rowIds = Array.from({ length: count }, (_, i) => `rank-${i}`);
  return (
    <View className="gap-2.5">
      <View
        className="mx-4 mt-4 mb-2 rounded-2xl p-4"
        style={{ backgroundColor: colors.neutral.ink }}
      >
        <Skeleton width="40%" height={12} />
        <View className="mt-3 flex-row items-baseline gap-3">
          <Skeleton width={64} height={36} />
          <Skeleton width={48} height={24} />
        </View>
      </View>
      <View className="gap-2 px-4">
        {rowIds.map(id => (
          <RankRowSkeleton key={id} />
        ))}
      </View>
    </View>
  );
}
