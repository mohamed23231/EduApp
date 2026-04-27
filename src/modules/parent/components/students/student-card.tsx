import type { Student } from '../../types';
import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon, Monogram, useMonogramTone } from '@/components/ui';
import colors from '@/components/ui/colors';
import { useAttendanceStats } from '../../hooks';

export type StudentCardProps = {
  student: Student;
  onPress: () => void;
  isRTL: boolean;
  attendanceLabel: string;
};

export function StudentCard({ student, onPress, isRTL, attendanceLabel }: StudentCardProps) {
  const { data: stats } = useAttendanceStats(student.id);
  const tone = useMonogramTone(student.id);
  const rate = stats?.attendanceRate;
  const hasRate = typeof rate === 'number' && !Number.isNaN(rate);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={student.fullName}
      style={({ pressed }) => ({
        marginHorizontal: 16,
        marginBottom: 10,
        backgroundColor: colors.neutral.card,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.neutral.rule,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Monogram name={student.fullName} tone={tone} size={48} />
      <View style={{ flex: 1 }}>
        <Text
          style={{
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
        <Text
          style={{
            color: colors.neutral.inkMuted,
            fontSize: 12,
            fontWeight: '500',
            marginTop: 2,
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
