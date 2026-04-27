import type { WeekBucket } from '../../utils/performance-aggregates';
import * as React from 'react';
import { Text, View } from 'react-native';
import colors from '@/components/ui/colors';

export type WeeklyBarsProps = {
  buckets: WeekBucket[];
  title: string;
  trend: string;
  currentRate: number;
  isRTL: boolean;
};

const MAX_HEIGHT = 80;
const MIN_HEIGHT = 8;

export function WeeklyBars({ buckets, title, trend, currentRate, isRTL }: WeeklyBarsProps) {
  const lastTwoIdx = buckets.length - 2;
  return (
    <View
      style={{
        marginHorizontal: 16,
        backgroundColor: colors.neutral.card,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: colors.neutral.rule,
        padding: 18,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.neutral.ink,
              fontSize: 13,
              fontWeight: '700',
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={{
              color: colors.neutral.inkMuted,
              fontSize: 11,
              fontWeight: '500',
              marginTop: 2,
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={1}
          >
            {trend}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
          <Text
            style={{
              color: colors.neutral.ink,
              fontSize: 22,
              fontWeight: '700',
              letterSpacing: -0.5,
            }}
          >
            {currentRate}
          </Text>
          <Text
            style={{
              color: colors.neutral.inkMuted,
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            %
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: MAX_HEIGHT + 24 }}>
        {buckets.map((b, i) => {
          const heightPct = b.totalCount > 0 ? b.rate / 100 : 0;
          const height = MIN_HEIGHT + heightPct * (MAX_HEIGHT - MIN_HEIGHT);
          const isCurrent = i === buckets.length - 1;
          const isRecent = i >= lastTwoIdx;
          const bg = b.totalCount === 0
            ? colors.neutral.rule
            : isCurrent
              ? colors.semantic.present
              : isRecent
                ? colors.neutral.ink
                : colors.neutral.cardWarm;
          return (
            <View
              key={b.weekIndex}
              style={{ flex: 1, alignItems: 'center', gap: 6 }}
            >
              <View
                style={{
                  width: '100%',
                  height,
                  backgroundColor: bg,
                  borderRadius: 6,
                }}
              />
              <Text
                style={{
                  fontSize: 9,
                  color: colors.neutral.inkMuted,
                  fontWeight: '600',
                }}
              >
                {b.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
