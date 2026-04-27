import type { TeacherAggregate } from '../../utils/performance-aggregates';
import * as React from 'react';
import { Text, View } from 'react-native';
import { Monogram, useMonogramTone } from '@/components/ui';
import colors from '@/components/ui/colors';

export type TeacherRowProps = {
  teacher: TeacherAggregate;
  isRTL: boolean;
};

export function TeacherRow({ teacher, isRTL }: TeacherRowProps) {
  const tone = useMonogramTone(teacher.teacherName);
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 14,
        backgroundColor: colors.neutral.card,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: colors.neutral.rule,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Monogram name={teacher.teacherName} tone={tone} size={42} />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.neutral.ink,
            fontSize: 14,
            fontWeight: '700',
            letterSpacing: -0.1,
            textAlign: isRTL ? 'right' : 'left',
          }}
          numberOfLines={1}
        >
          {teacher.teacherName}
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
          {teacher.subjects.join(' · ') || `${teacher.sessionsCount}`}
        </Text>
      </View>
    </View>
  );
}
