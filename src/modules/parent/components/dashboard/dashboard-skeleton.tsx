import * as React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui';
import colors from '@/components/ui/colors';

/**
 * Loading placeholder for the parent dashboard — mirrors the real layout
 * (top bar, child switcher pills, ink hero block, this-week tiles) so the
 * transition to loaded content does not jump. Replaces the bare
 * ActivityIndicator spinner per the Parent States Pass.
 */
export function DashboardSkeleton({ testID }: { testID?: string }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 16 }} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Skeleton width={36} height={36} radius={18} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="40%" height={12} />
          <Skeleton width="55%" height={16} />
        </View>
        <Skeleton width={44} height={44} radius={22} />
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Skeleton width={140} height={48} radius={999} />
        <Skeleton width={140} height={48} radius={999} />
      </View>

      <View
        style={{
          backgroundColor: colors.neutral.ink,
          borderRadius: colors.radii.r4,
          padding: 22,
          gap: 14,
        }}
      >
        <Skeleton width="35%" height={12} />
        <Skeleton width="80%" height={28} />
        <Skeleton width="60%" height={14} />
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[0, 1, 2].map(i => (
          <View
            key={i}
            style={{
              flex: 1,
              backgroundColor: colors.neutral.card,
              borderColor: colors.neutral.rule,
              borderWidth: 1,
              borderRadius: colors.radii.r4,
              padding: 16,
              gap: 12,
            }}
          >
            <Skeleton width="70%" height={12} />
            <Skeleton width="50%" height={28} />
          </View>
        ))}
      </View>
    </View>
  );
}
