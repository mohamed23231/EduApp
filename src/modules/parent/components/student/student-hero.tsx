import type { TFunction } from 'i18next';
import type { AttendanceStats, StudentDetails } from '../../types';
import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon, Monogram, useMonogramTone } from '@/components/ui';
import colors from '@/components/ui/colors';
import { StudentStatTile } from './student-stat-tile';

/**
 * Dark hero block for ParentStudentDetail — mirrors `screens-parent.jsx`
 * §"PARENT · STUDENT DETAIL". Big monogram + name + grade subtitle, then
 * a 3-stat strip (Attendance · Streak · Avg rating) on translucent tiles.
 */

type Stat = { label: string; value: string; highlight?: boolean };

export type StudentHeroProps = {
  student: StudentDetails;
  stats: AttendanceStats | undefined;
  onBack?: () => void;
  isRTL: boolean;
  t: TFunction;
};

function formatPct(rate?: number): string {
  if (typeof rate !== 'number' || Number.isNaN(rate))
    return '—';
  return `${Math.round(rate)}%`;
}

function formatStreak(days?: number, suffix = 'd'): string {
  if (typeof days !== 'number' || Number.isNaN(days))
    return '—';
  return `${days}${suffix}`;
}

function formatRating(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value))
    return '—';
  return value.toFixed(1);
}

export function StudentHero({ student, stats, onBack, isRTL, t }: StudentHeroProps) {
  const tone = useMonogramTone(student.id);
  const subtitleParts: string[] = [];
  if (student.gradeLevel)
    subtitleParts.push(student.gradeLevel);
  if (student.teacherName)
    subtitleParts.push(student.teacherName);
  const subtitle = subtitleParts.join(' · ');
  const tiles: Stat[] = [
    {
      label: t('parent.studentDetails.statAttendance', 'ATTENDANCE'),
      value: formatPct(stats?.attendanceRate),
      highlight: true,
    },
    {
      label: t('parent.studentDetails.statRating', 'AVG RATING'),
      value: formatRating(stats?.avgRating30d),
    },
    {
      label: t('parent.studentDetails.statStreak', 'STREAK'),
      value: formatStreak(stats?.currentStreakDays, t('parent.studentDetails.statStreakSuffix', 'd')),
    },
  ];

  return (
    <View
      style={{
        backgroundColor: colors.neutral.ink,
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 28,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -60,
          end: -60,
          width: 220,
          height: 220,
          borderRadius: 999,
          backgroundColor: colors.brand.primary,
          opacity: 0.35,
        }}
      />
      {onBack ? <BackButton onPress={onBack} label={t('parent.common.back', 'Back')} /> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Monogram name={student.fullName} tone={tone} size={72} ring />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.neutral.white,
              fontSize: 24,
              fontWeight: '700',
              letterSpacing: -0.5,
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={1}
          >
            {student.fullName}
          </Text>
          {subtitle
            ? (
                <Text
                  style={{
                    color: colors.neutral.dim,
                    fontSize: 13,
                    fontWeight: '500',
                    marginTop: 4,
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              )
            : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
        {tiles.map(tile => (
          <StudentStatTile
            key={tile.label}
            label={tile.label}
            value={tile.value}
            isRTL={isRTL}
            highlight={tile.highlight}
          />
        ))}
      </View>
    </View>
  );
}

function BackButton({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={8}
        style={{
          width: 40,
          height: 40,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.15)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="chevronL" size={16} color={colors.neutral.white} />
      </Pressable>
    </View>
  );
}
