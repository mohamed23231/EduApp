/**
 * PerformanceListSkeleton — loading placeholder for the student performance list.
 * Mirrors the summary-tile row + record rows so the layout doesn't jump.
 */

import { View } from 'react-native';
import { Skeleton } from '@/components/ui';
import colors from '@/components/ui/colors';

function RecordRowSkeleton() {
  return (
    <View
      className="flex-row gap-3 rounded-2xl border border-rule p-3.5"
      style={{ backgroundColor: colors.neutral.card }}
    >
      <View className="flex-1 gap-2">
        <Skeleton width="55%" height={14} />
        <Skeleton width="35%" height={12} />
      </View>
      <View className="items-end gap-2">
        <Skeleton width={56} height={20} radius={10} />
        <Skeleton width={40} height={14} />
      </View>
    </View>
  );
}

export function PerformanceListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View className="gap-2.5 p-4">
      <View className="mb-2 flex-row gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <View
            key={i}
            className="min-w-[70px] flex-1 items-center gap-2 rounded-2xl border border-rule p-3"
            style={{ backgroundColor: colors.neutral.card }}
          >
            <Skeleton width={36} height={18} />
            <Skeleton width="70%" height={10} />
          </View>
        ))}
      </View>
      {Array.from({ length: count }).map((_, i) => (
        <RecordRowSkeleton key={i} />
      ))}
    </View>
  );
}
