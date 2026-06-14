import type { Student } from '../../types';
import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon, Monogram, useMonogramTone } from '@/components/ui';
import colors from '@/components/ui/colors';
import { useAttendanceStats } from '../../hooks';

export type ProfileChildRowProps = {
  student: Student;
  onPress: () => void;
  isRTL: boolean;
  attendanceLabel: string;
};

export function ProfileChildRow({ student, onPress, isRTL, attendanceLabel }: ProfileChildRowProps) {
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
        marginBottom: 8,
        padding: 14,
        backgroundColor: colors.neutral.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.neutral.rule,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Monogram name={student.fullName} tone={tone} size={44} />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.neutral.ink,
            fontSize: 14,
            fontWeight: '700',
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
      <Icon name="arrowR" size={16} color={colors.neutral.dim} />
    </Pressable>
  );
}
