import type { Student } from '../../types';
import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon, Monogram, useMonogramTone } from '@/components/ui';
import colors from '@/components/ui/colors';
import { useAttendanceStats } from '../../hooks';
import { UnlinkedBadge } from '../student/unlinked-badge';

export type StudentCardProps = {
  student: Student;
  onPress: () => void;
  isRTL: boolean;
  attendanceLabel: string;
  /** Amber "Unlinked" pill label; when set, the row renders muted/read-only. */
  unlinkedLabel?: string;
};

export function StudentCard({ student, onPress, isRTL, attendanceLabel, unlinkedLabel }: StudentCardProps) {
  const isUnlinked = student.linkStatus === 'unlinked';
  const { data: stats } = useAttendanceStats(student.id);
  const tone = useMonogramTone(student.id);
  const rate = stats?.attendanceRate;
  const hasRate = typeof rate === 'number' && !Number.isNaN(rate);
  const showBadge = isUnlinked && Boolean(unlinkedLabel);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={student.fullName}
      accessibilityState={{ disabled: isUnlinked }}
      testID={`student-card-${student.id}`}
      style={({ pressed }) => ({
        marginHorizontal: 16,
        marginBottom: 10,
        backgroundColor: isUnlinked ? colors.semantic.excusedSoft : colors.neutral.card,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: isUnlinked ? colors.semantic.excused : colors.neutral.rule,
        padding: 14,
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: 12,
        opacity: pressed ? 0.9 : isUnlinked ? 0.7 : 1,
      })}
    >
      <Monogram name={student.fullName} tone={tone} size={48} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
          <Text
            style={{
              flexShrink: 1,
              color: colors.neutral.ink,
              fontSize: 15,
              fontWeight: '700',
              letterSpacing: -0.2,
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={1}
          >
            {student.fullName}
          </Text>
          {showBadge ? <UnlinkedBadge label={unlinkedLabel as string} /> : null}
        </View>
        <Text
          style={{
            color: colors.neutral.inkMuted,
            fontSize: 12,
            fontWeight: '500',
            textAlign: isRTL ? 'right' : 'left',
          }}
          numberOfLines={1}
        >
          {[student.gradeLevel, hasRate ? `${Math.round(rate as number)}% ${attendanceLabel}` : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
      <Icon name="arrowR" size={18} color={colors.neutral.inkMuted} />
    </Pressable>
  );
}
