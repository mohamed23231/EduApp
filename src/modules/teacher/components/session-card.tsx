/**
 * SessionCard
 * Polished card for a session instance on the dashboard.
 * Colored left-stripe per state, clear action affordances.
 * ACTIVE sessions show both attendance + end session actions.
 */

import type { SessionInstance } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { StatusBadge } from './status-badge';

/** Strip seconds from HH:mm:ss → HH:mm */
function formatTime(time: string): string {
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
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

const STATE_STRIPE: Record<string, string> = {
  DRAFT: '#F59E0B',
  ACTIVE: '#10B981',
  CLOSED: '#9CA3AF',
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
      style={styles.activeActions}
    >
      <Pressable
        onPress={() => onMarkAttendance(instanceId)}
        style={({ pressed }) => [styles.attendanceBtn, pressed && styles.attendanceBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel={t('teacher.sessions.markAttendance')}
      >
        <Ionicons name="checkmark-done-outline" size={16} color="#FFFFFF" />
        <Text style={styles.attendanceBtnText}>
          {t('teacher.sessions.markAttendance')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onEndSession(instanceId)}
        disabled={isEnding}
        style={({ pressed }) => [styles.endBtn, pressed && styles.endBtnPressed, isEnding && styles.endBtnDisabled]}
        accessibilityRole="button"
        accessibilityLabel={t('teacher.sessions.endSession')}
      >
        <Ionicons name="stop-circle-outline" size={16} color="#DC2626" />
        <Text style={styles.endBtnText}>
          {isEnding ? '...' : t('teacher.sessions.endSession')}
        </Text>
      </Pressable>
    </MotiView>
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
  const { t } = useTranslation();

  const stripeColor = STATE_STRIPE[instance.state] ?? '#9CA3AF';

  return (
    <View style={styles.card}>
      {/* Left colour stripe */}
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />

      <View style={styles.body}>
        {/* Top row */}
        <View style={styles.top}>
          <Text style={styles.subject} numberOfLines={1}>
            {instance.subject}
          </Text>
          <StatusBadge state={instance.state} />
        </View>

        {/* Meta row */}
        <View style={styles.meta}>
          <Ionicons name="time-outline" size={13} color="#9CA3AF" />
          <Text style={styles.metaText}>{formatTime(instance.time)}</Text>
          <View style={styles.dot} />
          <Ionicons name="people-outline" size={13} color="#9CA3AF" />
          <Text style={styles.metaText}>
            {t('teacher.sessions.studentCount', { count: instance.studentCount })}
          </Text>
        </View>

        {/* Attendance summary (active & closed) */}
        {(instance.state === 'CLOSED' || instance.state === 'ACTIVE') && instance.attendanceSummary && (
          <View style={styles.summaryRow}>
            <SummaryPill
              icon="checkmark-circle-outline"
              value={instance.attendanceSummary.present}
              color="#10B981"
              label={t('teacher.attendance.present')}
            />
            <SummaryPill
              icon="close-circle-outline"
              value={instance.attendanceSummary.absent}
              color="#EF4444"
              label={t('teacher.attendance.absent')}
            />
            <SummaryPill
              icon="time-outline"
              value={instance.attendanceSummary.excused}
              color="#F59E0B"
              label={t('teacher.attendance.excused')}
            />
          </View>
        )}

        {/* Actions — DRAFT: start button */}
        {instance.state === 'DRAFT' && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 18 }}
            style={styles.action}
          >
            <Button
              label={t('teacher.sessions.startSession')}
              onPress={() => onStartSession(instance.id)}
              loading={isStarting}
              size="sm"
              variant="default"
            />
          </MotiView>
        )}

        {/* Actions — ACTIVE: attendance + end session */}
        {instance.state === 'ACTIVE' && (
          <ActiveActions
            instanceId={instance.id}
            isEnding={isEnding}
            onMarkAttendance={onMarkAttendance}
            onEndSession={onEndSession}
          />
        )}
      </View>
    </View>
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
    <View style={[styles.summaryPill, { backgroundColor: `${color}18` }]}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[styles.summaryCount, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  stripe: {
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  subject: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  summaryCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  action: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  activeActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  attendanceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#10B981',
    borderRadius: 10,
  },
  attendanceBtnPressed: {
    backgroundColor: '#059669',
  },
  attendanceBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  endBtnPressed: {
    backgroundColor: '#FEE2E2',
  },
  endBtnDisabled: {
    opacity: 0.5,
  },
  endBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
});
