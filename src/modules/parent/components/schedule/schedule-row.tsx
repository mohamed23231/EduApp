import type { TFunction } from 'i18next';
import type { Student } from '../../types';
import type { SupportedLocale } from '@/lib/date';
import * as React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Icon, Monogram, useMonogramTone } from '@/components/ui';
import colors from '@/components/ui/colors';
import { formatCalendarDay, formatTime } from '@/lib/date';
import { useUpcomingSessions } from '../../hooks';

export type ScheduleRowProps = {
  student: Student;
  locale: SupportedLocale;
  isRTL: boolean;
  t: TFunction;
  onPress: () => void;
};

export function ScheduleRow({ student, locale, isRTL, t, onPress }: ScheduleRowProps) {
  const { data, isLoading } = useUpcomingSessions(student.id, 1);
  const tone = useMonogramTone(student.id);
  const next = data?.[0];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={student.fullName}
      style={{
        marginHorizontal: 16,
        marginBottom: 10,
        backgroundColor: colors.neutral.card,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.neutral.rule,
        padding: 14,
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: 12,
      }}
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
          {student.fullName.split(' ')[0]}
        </Text>
        {isLoading
          ? <ActivityIndicator size="small" color={colors.neutral.dim} style={{ marginTop: 4, alignSelf: isRTL ? 'flex-end' : 'flex-start' }} />
          : next
            ? (
                <Text
                  style={{
                    color: colors.neutral.inkMuted,
                    fontSize: 12,
                    fontWeight: '500',
                    marginTop: 2,
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                  numberOfLines={2}
                >
                  {next.sessionName}
                  {' · '}
                  {formatCalendarDay(next.startsAt, locale)}
                  {' · '}
                  {formatTime(next.startsAt, locale)}
                  {next.teacherName ? ` · ${next.teacherName}` : ''}
                </Text>
              )
            : (
                <Text
                  style={{
                    color: colors.neutral.inkMuted,
                    fontSize: 12,
                    fontWeight: '500',
                    marginTop: 2,
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                >
                  {t('parent.schedule.emptyMessage')}
                </Text>
              )}
      </View>
      {next
        ? <Icon name="arrowR" size={18} color={colors.neutral.inkMuted} />
        : null}
    </Pressable>
  );
}
