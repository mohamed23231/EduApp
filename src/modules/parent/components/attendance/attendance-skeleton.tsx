import * as React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/ui';
import colors from '@/components/ui/colors';

/**
 * Loading placeholder for the parent attendance screen — header card + a few
 * record rows, matching the loaded layout so it does not jump on resolve.
 * Replaces the legacy hand-rolled gray-block skeleton.
 */
export function AttendanceSkeleton({ testID }: { testID?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.paper, padding: 16 }} testID={testID}>
      <View
        style={{
          backgroundColor: colors.neutral.card,
          borderColor: colors.neutral.rule,
          borderWidth: 1,
          borderRadius: colors.radii.r4,
          padding: 20,
          marginBottom: 16,
          gap: 16,
        }}
      >
        <Skeleton width="50%" height={20} />
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {[0, 1, 2].map(i => (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
              <Skeleton width={40} height={24} />
              <Skeleton width="70%" height={10} />
            </View>
          ))}
        </View>
      </View>
      {[0, 1, 2, 3].map(i => (
        <View
          key={i}
          style={{
            backgroundColor: colors.neutral.card,
            borderColor: colors.neutral.rule,
            borderWidth: 1,
            borderRadius: colors.radii.r3,
            padding: 16,
            marginBottom: 10,
            gap: 10,
          }}
        >
          <Skeleton width="65%" height={15} />
          <Skeleton width="40%" height={12} />
        </View>
      ))}
    </View>
  );
}
