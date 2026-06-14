/**
 * SessionMetaPills — days-of-week, student count, and paused badge pills.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

const DAY_KEYS = ['', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

type SessionMetaPillsProps = {
  daysOfWeek: number[] | undefined;
  studentCount: number;
  isPaused: boolean;
};

export function SessionMetaPills({ daysOfWeek, studentCount, isPaused }: SessionMetaPillsProps) {
  const { t } = useTranslation();

  const daysLabel = useMemo(() => {
    if (!daysOfWeek?.length)
      return '';
    return daysOfWeek
      .map((num) => {
        const key = DAY_KEYS[num] ?? '';
        return key
          ? t(`manager.days.${key}`, { defaultValue: key })
          : '';
      })
      .filter(Boolean)
      .join(', ');
  }, [daysOfWeek, t]);

  return (
    <View className="mb-4 flex-row flex-wrap gap-1.5 px-4">
      {daysLabel
        ? (
            <View className="flex-row items-center gap-1 rounded-full px-2.5 py-1" style={{ backgroundColor: colors.neutral.cardWarm, borderWidth: 1, borderColor: colors.neutral.rule }}>
              <Text style={{ fontSize: 12, color: colors.neutral.inkMuted }}>{daysLabel}</Text>
            </View>
          )
        : null}
      {studentCount > 0
        ? (
            <View className="flex-row items-center gap-1 rounded-full px-2.5 py-1" style={{ backgroundColor: colors.neutral.cardWarm, borderWidth: 1, borderColor: colors.neutral.rule }}>
              <Text style={{ fontSize: 12, color: colors.neutral.inkMuted }}>
                {t('manager.sessionDetail.studentCount', { count: studentCount, defaultValue: '{{count}} students' })}
              </Text>
            </View>
          )
        : null}
      {isPaused
        ? (
            <View className="flex-row items-center gap-1 rounded-full px-2.5 py-1" style={{ backgroundColor: colors.semantic.excusedSoft }}>
              <Text style={{ fontSize: 12, color: colors.semantic.excusedInk, fontWeight: '600' }}>
                {t('manager.sessionDetail.paused', { defaultValue: 'Paused' })}
              </Text>
            </View>
          )
        : null}
    </View>
  );
}
