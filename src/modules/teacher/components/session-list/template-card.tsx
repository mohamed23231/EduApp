/**
 * TemplateCard — session-list sub-component.
 * Standard bg-card border-rule card for a session template.
 */

import type { SessionTemplate } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { I18nManager, Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

function formatTime(time: string): string {
  const parts = time.split(':');
  if (parts.length >= 2)
    return `${parts[0]}:${parts[1]}`;
  return time;
}

function formatDays(days: number[], t: (key: string, fb: string) => string): string {
  const map: Record<number, string> = {
    1: t('teacher.sessions.weekdays.mon', 'Mon'),
    2: t('teacher.sessions.weekdays.tue', 'Tue'),
    3: t('teacher.sessions.weekdays.wed', 'Wed'),
    4: t('teacher.sessions.weekdays.thu', 'Thu'),
    5: t('teacher.sessions.weekdays.fri', 'Fri'),
    6: t('teacher.sessions.weekdays.sat', 'Sat'),
    7: t('teacher.sessions.weekdays.sun', 'Sun'),
  };
  return days.map(d => map[d] ?? '').filter(Boolean).join(' · ');
}

type Props = {
  item: SessionTemplate;
  index: number;
  onPress: () => void;
};

export function TemplateCard({ item, index, onPress }: Props) {
  const { t } = useTranslation();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 240, delay: index * 50 }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        className="flex-row items-center gap-3.5 rounded-2xl border border-rule p-3.5"
        style={({ pressed }) => [
          { backgroundColor: pressed ? colors.neutral.paper : colors.neutral.card },
        ]}
      >
        {/* Time block */}
        <View
          className="w-14 items-center rounded-xl py-2"
          style={{ backgroundColor: colors.neutral.paper }}
        >
          <Text className="text-[16px] leading-tight font-bold text-ink">
            {formatTime(item.time)}
          </Text>
          <Text className="mt-0.5 text-micro font-bold tracking-wide text-ink-muted uppercase">
            {item.daysOfWeek.length > 0 ? `${item.daysOfWeek.length}d/wk` : '—'}
          </Text>
        </View>

        {/* Body */}
        <View className="flex-1 gap-1">
          <Text className="text-body-lg font-bold text-ink" numberOfLines={1}>
            {item.subject}
          </Text>
          <View className="flex-row items-center gap-1">
            <Ionicons name="calendar-outline" size={12} color={colors.neutral.inkMuted} />
            <Text className="text-small text-ink-muted">
              {formatDays(item.daysOfWeek, t as (key: string, fb: string) => string)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="people-outline" size={12} color={colors.neutral.inkMuted} />
            <Text className="text-small text-ink-muted">
              {t('teacher.sessions.studentCount', { count: item.assignedStudents.length })}
            </Text>
          </View>
        </View>

        <Ionicons
          name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
          size={16}
          color={colors.neutral.dim}
        />
      </Pressable>
    </MotiView>
  );
}
