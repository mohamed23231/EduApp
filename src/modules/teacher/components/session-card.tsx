/**
 * SessionCard
 * Phase-9 restyled card for a session instance on the dashboard.
 * ACTIVE → dark hero card with lime glow.
 * DRAFT / CLOSED → standard bg-card border-rule card.
 */

import type { SessionInstance } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { I18nManager, Pressable, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { StatusBadge } from './status-badge';

function formatTime(time: string): string {
  const parts = time.split(':');
  if (parts.length >= 2)
    return `${parts[0]}:${parts[1]}`;
  return time;
}

type SessionCardProps = {
  instance: SessionInstance;
  onStartSession: (id: string) => void;
  onMarkAttendance: (id: string) => void;
  onEndSession: (id: string) => void;
  isStarting: boolean;
  isEnding: boolean;
};

function ActiveActions({
  instanceId,
  isEnding,
  onMarkAttendance,
  onEndSession,
}: {
  instanceId: string;
  isEnding: boolean;
  onMarkAttendance: (id: string) => void;
  onEndSession: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 18 }}
      className="mt-2 flex-row gap-2"
    >
      <Pressable
        onPress={() => onMarkAttendance(instanceId)}
        className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-brand px-3.5 py-2"
        style={({ pressed }) => pressed ? [{ opacity: 0.85 }] : undefined}
        accessibilityRole="button"
        accessibilityLabel={t('teacher.sessions.markAttendance', 'Mark attendance')}
      >
        <Ionicons name="checkmark-done-outline" size={16} color={colors.neutral.ink} />
        <Text className="text-body font-semibold text-ink">
          {t('teacher.sessions.markAttendance', 'Mark attendance')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onEndSession(instanceId)}
        disabled={isEnding}
        className="flex-row items-center justify-center gap-1.5 rounded-xl border border-absent-soft px-3.5 py-2"
        style={({ pressed }) => [
          { backgroundColor: colors.semantic.absentSoft },
          pressed && { opacity: 0.8 },
          isEnding && { opacity: 0.5 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('teacher.sessions.endSession', 'End session')}
      >
        <Ionicons name="stop-circle-outline" size={16} color={colors.semantic.absent} />
        <Text className="text-body font-semibold" style={{ color: colors.semantic.absent }}>
          {isEnding ? '...' : t('teacher.sessions.endSession', 'End session')}
        </Text>
      </Pressable>
    </MotiView>
  );
}

function SummaryPill({
  icon,
  value,
  color,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  color: string;
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-1 rounded-xl px-2 py-0.5" style={{ backgroundColor: `${color}20` }}>
      <Ionicons name={icon} size={13} color={color} />
      <Text className="text-small font-semibold" style={{ color }}>{value}</Text>
      <Text className="text-caption font-medium" style={{ color }}>{label}</Text>
    </View>
  );
}

function ActiveCard({ instance, isEnding, onMarkAttendance, onEndSession }: {
  instance: SessionInstance;
  isEnding: boolean;
  onMarkAttendance: (id: string) => void;
  onEndSession: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <View
      className="overflow-hidden rounded-2xl"
      style={{ backgroundColor: colors.neutral.ink, position: 'relative' }}
    >
      {/* Lime glow blob */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -40,
          [I18nManager.isRTL ? 'left' : 'right']: -40,
          width: 160,
          height: 160,
          borderRadius: 999,
          backgroundColor: colors.brand.primary,
          opacity: 0.25,
        }}
      />
      <View className="gap-1.5 p-4" style={{ position: 'relative' }}>
        <View className="mb-1 flex-row items-center gap-2">
          <View
            className="size-2 rounded-full"
            style={{ backgroundColor: colors.brand.primary }}
          />
          <Text
            className="text-caption font-bold tracking-widest uppercase"
            style={{ color: colors.brand.primary }}
          >
            {t('teacher.dashboard.activeSessions', 'Live')}
          </Text>
        </View>
        <Text className="text-title font-bold text-white" numberOfLines={1}>
          {instance.subject}
        </Text>
        <Text className="text-body" style={{ color: colors.neutral.dim }}>
          {formatTime(instance.time)}
          {' · '}
          {t('teacher.sessions.studentCount', { count: instance.studentCount })}
        </Text>
        {instance.attendanceSummary && (
          <View className="mt-1 flex-row gap-1.5">
            <SummaryPill
              icon="checkmark-circle-outline"
              value={instance.attendanceSummary.present}
              color={colors.semantic.present}
              label={t('teacher.attendance.present', 'Present')}
            />
            <SummaryPill
              icon="close-circle-outline"
              value={instance.attendanceSummary.absent}
              color={colors.semantic.absent}
              label={t('teacher.attendance.absent', 'Absent')}
            />
            <SummaryPill
              icon="time-outline"
              value={instance.attendanceSummary.excused}
              color={colors.semantic.excused}
              label={t('teacher.attendance.excused', 'Excused')}
            />
          </View>
        )}
        <ActiveActions
          instanceId={instance.id}
          isEnding={isEnding}
          onMarkAttendance={onMarkAttendance}
          onEndSession={onEndSession}
        />
      </View>
    </View>
  );
}

function StandardCard({ instance, isStarting, onStartSession }: {
  instance: SessionInstance;
  isStarting: boolean;
  onStartSession: (id: string) => void;
}) {
  const { t } = useTranslation();
  const stripeColor = instance.state === 'DRAFT' ? colors.semantic.excused : colors.neutral.dim;
  return (
    <View
      className="flex-row overflow-hidden rounded-2xl border border-rule"
      style={{ backgroundColor: colors.neutral.card }}
    >
      <View style={{ width: 4, backgroundColor: stripeColor, alignSelf: 'stretch' }} />
      <View className="flex-1 gap-1.5 p-3.5">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="flex-1 text-[16px] font-bold text-ink" numberOfLines={1}>
            {instance.subject}
          </Text>
          <StatusBadge state={instance.state} />
        </View>
        <View className="flex-row items-center gap-1">
          <Ionicons name="time-outline" size={13} color={colors.neutral.inkMuted} />
          <Text className="text-body text-ink-muted">{formatTime(instance.time)}</Text>
          <View className="mx-1 size-[3px] rounded-full" style={{ backgroundColor: colors.neutral.rule }} />
          <Ionicons name="people-outline" size={13} color={colors.neutral.inkMuted} />
          <Text className="text-body text-ink-muted">
            {t('teacher.sessions.studentCount', { count: instance.studentCount })}
          </Text>
        </View>
        {instance.state === 'CLOSED' && instance.attendanceSummary && (
          <View className="mt-1 flex-row gap-1.5">
            <SummaryPill
              icon="checkmark-circle-outline"
              value={instance.attendanceSummary.present}
              color={colors.semantic.present}
              label={t('teacher.attendance.present', 'Present')}
            />
            <SummaryPill
              icon="close-circle-outline"
              value={instance.attendanceSummary.absent}
              color={colors.semantic.absent}
              label={t('teacher.attendance.absent', 'Absent')}
            />
            <SummaryPill
              icon="time-outline"
              value={instance.attendanceSummary.excused}
              color={colors.semantic.excused}
              label={t('teacher.attendance.excused', 'Excused')}
            />
          </View>
        )}
        {instance.state === 'DRAFT' && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 18 }}
            className="mt-2 self-start"
          >
            <Button
              label={t('teacher.sessions.startSession', 'Start session')}
              onPress={() => onStartSession(instance.id)}
              loading={isStarting}
              size="sm"
              variant="default"
            />
          </MotiView>
        )}
      </View>
    </View>
  );
}

export function SessionCard({
  instance,
  onStartSession,
  onMarkAttendance,
  onEndSession,
  isStarting,
  isEnding,
}: SessionCardProps) {
  if (instance.state === 'ACTIVE') {
    return (
      <ActiveCard
        instance={instance}
        isEnding={isEnding}
        onMarkAttendance={onMarkAttendance}
        onEndSession={onEndSession}
      />
    );
  }
  return (
    <StandardCard
      instance={instance}
      isStarting={isStarting}
      onStartSession={onStartSession}
    />
  );
}
