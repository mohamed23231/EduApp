import type { AttendanceStats } from '../../types';
import * as React from 'react';
import { Text, View } from 'react-native';
import { BigNumber, Icon } from '@/components/ui';
import colors from '@/components/ui/colors';

/**
 * "This week" tile row — three KPI tiles per visual-parent.md (attendance %,
 * streak, avg rating). Streak + avgRating come from the Phase 8 backend
 * additions (`currentStreakDays`, `avgRating30d`). Until they ship, both
 * tiles render an em-dash so the row stays balanced.
 */

export type ThisWeekTilesProps = {
  stats: AttendanceStats | undefined;
  isRTL: boolean;
  t: (key: string, opts?: any) => string;
};

type AttendanceTileProps = {
  value: number | null;
  label: string;
  isRTL: boolean;
};

function AttendanceTile({ value, label, isRTL }: AttendanceTileProps) {
  return (
    <View
      style={{
        flex: 1.4,
        padding: 16,
        borderRadius: 22,
        backgroundColor: 'rgba(34,197,114,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(34,197,114,0.35)',
        justifyContent: 'space-between',
        minHeight: 110,
      }}
      testID="tile-attendance"
    >
      <Text
        style={{
          color: colors.neutral.ink,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.5,
          opacity: 0.7,
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        {label}
      </Text>
      {value === null
        ? <Text style={{ color: colors.neutral.inkMuted, fontSize: 36, fontWeight: '700' }}>—</Text>
        : <BigNumber value={value} suffix="%" size={36} weight={700} color={colors.neutral.ink} />}
    </View>
  );
}

type StreakTileProps = {
  value: number | null;
  label: string;
  unit: (count: number) => string;
};

function StreakTile({ value, label, unit }: StreakTileProps) {
  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        borderRadius: 22,
        backgroundColor: colors.neutral.ink,
        justifyContent: 'space-between',
        minHeight: 110,
      }}
      testID="tile-streak"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name="flame" size={16} color={colors.brand.primary} />
        <Text style={{ color: colors.neutral.dim, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
          {label}
        </Text>
      </View>
      {value === null
        ? <Text style={{ color: colors.neutral.dim, fontSize: 32, fontWeight: '700' }}>—</Text>
        : (
            <View>
              <BigNumber value={value} size={32} weight={700} color={colors.neutral.white} />
              <Text style={{ color: colors.neutral.dim, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                {unit(value)}
              </Text>
            </View>
          )}
    </View>
  );
}

type RatingTileProps = {
  value: number | null;
  label: string;
  scale: string;
};

function RatingTile({ value, label, scale }: RatingTileProps) {
  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        borderRadius: 22,
        backgroundColor: colors.neutral.card,
        borderWidth: 1.5,
        borderColor: colors.neutral.rule,
        justifyContent: 'space-between',
        minHeight: 110,
      }}
      testID="tile-rating"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name="starFill" size={16} color={colors.semantic.excused} />
        <Text style={{ color: colors.neutral.inkMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
          {label}
        </Text>
      </View>
      {value === null
        ? <Text style={{ color: colors.neutral.inkMuted, fontSize: 32, fontWeight: '700' }}>—</Text>
        : (
            <View>
              <BigNumber value={value.toFixed(1)} size={32} weight={700} color={colors.neutral.ink} />
              <Text style={{ color: colors.neutral.inkMuted, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
                {scale}
              </Text>
            </View>
          )}
    </View>
  );
}

export function ThisWeekTiles({ stats, isRTL, t }: ThisWeekTilesProps) {
  const rate = stats?.attendanceRate;
  const streak = stats?.currentStreakDays;
  const avgRating = stats?.avgRating30d;

  const attendanceValue = typeof rate === 'number' && !Number.isNaN(rate) ? Math.round(rate) : null;
  const streakValue = typeof streak === 'number' ? streak : null;
  const ratingValue = typeof avgRating === 'number' ? avgRating : null;

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 22 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <AttendanceTile
          value={attendanceValue}
          label={t('parent.dashboard.tiles.attendanceLabel', 'ATTENDANCE')}
          isRTL={isRTL}
        />
        <StreakTile
          value={streakValue}
          label={t('parent.dashboard.tiles.streakLabel', 'STREAK')}
          unit={count => t('parent.dashboard.tiles.streakUnit', { defaultValue: 'day{{plural}}', plural: count === 1 ? '' : 's' })}
        />
        <RatingTile
          value={ratingValue}
          label={t('parent.dashboard.tiles.ratingLabel', 'RATING')}
          scale={t('parent.dashboard.tiles.ratingScale', 'avg / 10')}
        />
      </View>
    </View>
  );
}
