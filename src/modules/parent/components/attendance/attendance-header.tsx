import type { TFunction } from 'i18next';
import type { AttendanceStats, StudentDetails } from '../../types/student.types';
import * as React from 'react';
import { View } from 'react-native';
import { BigNumber, Hairline, Text } from '@/components/ui';
import colors from '@/components/ui/colors';

/**
 * Attendance screen header — student name + a present/absent stat strip on a
 * paper card with hairline separation (replaces the legacy white-card-on-gray
 * grammar called out in `visual-parent.md`).
 */

type AttendanceHeaderProps = {
  student: StudentDetails | undefined;
  stats: AttendanceStats | undefined;
  isRTL: boolean;
  t: TFunction;
};

function StatBlock({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <BigNumber value={value} size={28} color={color} />
      <Text
        style={{
          marginTop: 4,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          color: colors.neutral.inkMuted,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function AttendanceHeader({ student, stats, isRTL, t }: AttendanceHeaderProps) {
  if (!student && !stats)
    return null;

  return (
    <View
      style={{
        marginBottom: 16,
        backgroundColor: colors.neutral.card,
        borderColor: colors.neutral.rule,
        borderWidth: 1,
        borderRadius: colors.radii.r4,
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: colors.neutral.ink,
          letterSpacing: -0.4,
          textAlign: isRTL ? 'right' : 'left',
        }}
        numberOfLines={1}
      >
        {student?.fullName || t('parent.attendance.studentName', 'Student')}
      </Text>

      {stats
        ? (
            <>
              <View style={{ marginTop: 16 }}>
                <Hairline color={colors.neutral.rule} />
              </View>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 14 }}>
                <StatBlock
                  value={`${Math.round(stats.attendanceRate)}%`}
                  label={t('parent.attendance.rate', 'Attendance Rate')}
                  color={colors.semantic.present}
                />
                <StatBlock
                  value={stats.absent}
                  label={t('parent.attendance.absentCount', 'Absences')}
                  color={colors.semantic.absent}
                />
                <StatBlock
                  value={stats.excused}
                  label={t('parent.attendance.excused', 'Excused')}
                  color={colors.semantic.excused}
                />
              </View>
            </>
          )
        : null}
    </View>
  );
}
