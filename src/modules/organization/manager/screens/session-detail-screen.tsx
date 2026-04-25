/**
 * SessionDetailScreen — Manager
 * Template overview + statistics + recent instances with full actions.
 * Closed instances are tappable to view attendance details.
 * Attendance marking happens on a dedicated screen (OrgAttendanceScreen).
 */

import type { OrgSessionInstance } from '../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, I18nManager, Pressable, View as RNView, StyleSheet } from 'react-native';
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import {
  useCloseSession,
  useOrgInstances,
  useOrgSession,
  useStartSession,
} from '../hooks';
import { useManagerStore } from '../store/manager-store';

const DAY_KEYS = ['', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const STATE_BADGE: Record<string, { bg: string; text: string; dot: string; stripe: string }> = {
  DRAFT: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', stripe: '#F59E0B' },
  ACTIVE: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', stripe: '#10B981' },
  CLOSED: { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF', stripe: '#9CA3AF' },
  CANCELLED: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', stripe: '#9CA3AF' },
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function groupInstancesByDate(
  instances: OrgSessionInstance[],
): Array<{ date: string; instances: OrgSessionInstance[] }> {
  const map = new Map<string, OrgSessionInstance[]>();
  for (const inst of instances) {
    const group = map.get(inst.date) ?? [];
    group.push(inst);
    map.set(inst.date, group);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, grouped]) => ({ date, instances: grouped }));
}

export function SessionDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const activeOrgId = useManagerStore.use.activeOrgId();

  const sessionQuery = useOrgSession(activeOrgId, params.id);
  const fromDate = daysAgo(30); // Show 30 days of history
  const toDate = new Date().toISOString().slice(0, 10);
  const instancesQuery = useOrgInstances(activeOrgId, { from: fromDate, to: toDate });

  if (sessionQuery.isLoading || instancesQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F9FAFB]">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (sessionQuery.isError || instancesQuery.isError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F9FAFB] px-6">
        <Text className="font-inter text-center text-base text-rose-600">
          Failed to load session data.
        </Text>
        <Button
          className="mt-4"
          variant="outline"
          label="Retry"
          fullWidth={false}
          onPress={() => {
            sessionQuery.refetch();
            instancesQuery.refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SessionDetailContent
      templateId={params.id}
      sessionQuery={sessionQuery}
      instancesQuery={instancesQuery}
      activeOrgId={activeOrgId}
    />
  );
}

// ---------------------------------------------------------------------------
// Statistics summary — computed from instances
// ---------------------------------------------------------------------------

function StatCard({ value, label, icon, color }: {
  value: string | number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <RNView style={styles.statCard}>
      <RNView style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </RNView>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </RNView>
  );
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

type ContentProps = {
  templateId: string;
  sessionQuery: ReturnType<typeof useOrgSession>;
  instancesQuery: ReturnType<typeof useOrgInstances>;
  activeOrgId: string | null | undefined;
};

// eslint-disable-next-line max-lines-per-function
function SessionDetailContent({ templateId, sessionQuery, instancesQuery, activeOrgId }: ContentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const template = sessionQuery.data;

  const sessionInstances = useMemo(
    () => (instancesQuery.data?.data ?? []).filter(i => i.templateId === templateId),
    [instancesQuery.data?.data, templateId],
  );
  const groupedInstances = useMemo(() => groupInstancesByDate(sessionInstances), [sessionInstances]);

  // Compute statistics from instances
  const stats = useMemo(() => {
    const closed = sessionInstances.filter(i => i.state === 'CLOSED');
    const active = sessionInstances.filter(i => i.state === 'ACTIVE');
    const upcoming = sessionInstances.filter(i => i.state === 'DRAFT');
    return {
      completed: closed.length,
      active: active.length,
      upcoming: upcoming.length,
      total: sessionInstances.length,
    };
  }, [sessionInstances]);

  const startMutation = useStartSession(activeOrgId);
  const closeMutation = useCloseSession(activeOrgId);

  const daysOfWeekLabel = useMemo(() => {
    const days = template?.daysOfWeek;
    if (!days?.length) {
      return '';
    }
    return days
      .map((num) => {
        const key = DAY_KEYS[num] ?? '';
        return key ? t(`manager.days.${key}`, { defaultValue: key }) : '';
      })
      .filter(Boolean)
      .join(', ');
  }, [template, t]);

  const handleCloseSession = useCallback(
    (instanceId: string) => {
      Alert.alert(
        t('manager.sessionDetail.closeWarningTitle', { defaultValue: 'Close session' }),
        t('manager.sessionDetail.closeWarning', {
          count: 0,
          defaultValue: 'Unmarked students will be auto-marked as absent. Continue?',
        }),
        [
          { text: t('manager.common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
          {
            text: t('manager.sessionDetail.closeConfirm', { defaultValue: 'Confirm' }),
            style: 'destructive',
            onPress: () => closeMutation.mutate(instanceId),
          },
        ],
      );
    },
    [closeMutation, t],
  );

  const handleViewAttendance = useCallback(
    (instanceId: string) => {
      router.push(AppRoute.manager.attendance(instanceId));
    },
    [router],
  );

  const studentCount = template?.studentCount ?? template?.students?.length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <ScrollView contentContainerClassName="px-5 py-5">
        {/* Template header */}
        <Text className="font-inter text-2xl font-bold text-slate-900">
          {template?.subject ?? t('manager.sessionDetail.title', { defaultValue: 'Session detail' })}
        </Text>
        <Text className="font-inter mt-1 text-base text-slate-500">
          {template?.time}
          {' · '}
          {template?.assignedMember.name}
        </Text>

        {template && (
          <RNView style={styles.metaRow}>
            {daysOfWeekLabel
              ? (
                  <RNView style={styles.metaPill}>
                    <Ionicons name="calendar-outline" size={13} color="#6B7280" />
                    <Text className="font-inter text-xs text-slate-500">{daysOfWeekLabel}</Text>
                  </RNView>
                )
              : null}
            {template.durationMinutes > 0
              ? (
                  <RNView style={styles.metaPill}>
                    <Ionicons name="time-outline" size={13} color="#6B7280" />
                    <Text className="font-inter text-xs text-slate-500">
                      {t('manager.sessionDetail.durationValue', { minutes: template.durationMinutes, defaultValue: '{{minutes}} min' })}
                    </Text>
                  </RNView>
                )
              : null}
            {studentCount > 0
              ? (
                  <RNView style={styles.metaPill}>
                    <Ionicons name="people-outline" size={13} color="#6B7280" />
                    <Text className="font-inter text-xs text-slate-500">
                      {t('manager.sessionDetail.studentCount', { count: studentCount, defaultValue: '{{count}} students' })}
                    </Text>
                  </RNView>
                )
              : null}
            {template.isPaused
              ? (
                  <RNView style={[styles.metaPill, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="pause-circle-outline" size={13} color="#92400E" />
                    <Text className="font-inter text-xs font-medium text-amber-800">
                      {t('manager.sessionDetail.paused', { defaultValue: 'Paused' })}
                    </Text>
                  </RNView>
                )
              : null}
          </RNView>
        )}

        {/* Statistics */}
        {stats.total > 0 && (
          <>
            <Text className="font-inter mt-6 mb-3 text-sm font-semibold tracking-wide text-slate-400 uppercase">
              {t('manager.sessionDetail.statsTitle', { defaultValue: 'Statistics (30 days)' })}
            </Text>
            <RNView style={styles.statsGrid}>
              <StatCard
                value={stats.completed}
                label={t('manager.sessionDetail.statsCompleted', { defaultValue: 'Completed' })}
                icon="checkmark-circle-outline"
                color="#10B981"
              />
              <StatCard
                value={stats.active}
                label={t('manager.sessionDetail.statsActive', { defaultValue: 'Active' })}
                icon="flash-outline"
                color="#3B82F6"
              />
              <StatCard
                value={stats.upcoming}
                label={t('manager.sessionDetail.statsUpcoming', { defaultValue: 'Upcoming' })}
                icon="time-outline"
                color="#F59E0B"
              />
              <StatCard
                value={stats.total}
                label={t('manager.sessionDetail.statsTotal', { defaultValue: 'Total' })}
                icon="layers-outline"
                color="#6366F1"
              />
            </RNView>
          </>
        )}

        {/* Recent instances */}
        <Text className="font-inter mt-6 mb-3 text-sm font-semibold tracking-wide text-slate-400 uppercase">
          {t('manager.sessionDetail.recentInstances', { defaultValue: 'Recent instances' })}
        </Text>

        {groupedInstances.length === 0
          ? (
              <View className="items-center py-8">
                <Ionicons name="calendar-outline" size={32} color="#D1D5DB" />
                <Text className="font-inter mt-2 text-sm text-slate-400">
                  {t('manager.sessionDetail.noInstances', { defaultValue: 'No instances found for the last 30 days.' })}
                </Text>
              </View>
            )
          : (
              <RNView style={{ gap: 16 }}>
                {groupedInstances.map(group => (
                  <RNView key={group.date} style={{ gap: 8 }}>
                    <Text className="font-inter text-xs font-medium text-slate-400">{group.date}</Text>
                    {group.instances.map(instance => (
                      <InstanceCard
                        key={instance.id}
                        instance={instance}
                        onStart={() => startMutation.mutate(instance.id)}
                        onClose={() => handleCloseSession(instance.id)}
                        onViewAttendance={() => handleViewAttendance(instance.id)}
                        t={t}
                      />
                    ))}
                  </RNView>
                ))}
              </RNView>
            )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Instance card — all states are actionable
// ---------------------------------------------------------------------------

function InstanceCard({
  instance,
  onStart,
  onClose,
  onViewAttendance,
  t,
}: {
  instance: OrgSessionInstance;
  onStart: () => void;
  onClose: () => void;
  onViewAttendance: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const badge = STATE_BADGE[instance.state] ?? STATE_BADGE.CLOSED;
  const studentCount = instance.studentCount ?? instance.students?.length ?? 0;

  return (
    <RNView style={styles.instanceCard}>
      <RNView style={[styles.instanceStripe, { backgroundColor: badge.stripe }]} />
      <RNView style={styles.instanceBody}>
        {/* Top row: time + badge */}
        <RNView style={styles.instanceTopRow}>
          <RNView style={{ flex: 1 }}>
            <Text className="font-inter text-base font-semibold text-slate-900">{instance.time}</Text>
            <RNView style={styles.instanceMeta}>
              <Ionicons name="people-outline" size={12} color="#9CA3AF" />
              <Text className="font-inter text-xs text-slate-400">
                {t('manager.dashboard.sessionStudents', { count: studentCount, defaultValue: '{{count}} students' })}
              </Text>
            </RNView>
          </RNView>
          <RNView style={[styles.badge, { backgroundColor: badge.bg }]}>
            <RNView style={[styles.badgeDot, { backgroundColor: badge.dot }]} />
            <Text style={[styles.badgeText, { color: badge.text }]}>
              {t(`manager.sessionDetail.instanceState.${instance.state.toLowerCase()}`, { defaultValue: instance.state })}
            </Text>
          </RNView>
        </RNView>

        {/* DRAFT: Start session */}
        {instance.state === 'DRAFT' && (
          <RNView style={styles.actionRow}>
            <Button
              label={t('manager.dashboard.startSession', { defaultValue: 'Start Session' })}
              onPress={onStart}
              size="sm"
              variant="default"
            />
          </RNView>
        )}

        {/* ACTIVE: Mark Attendance + End Session */}
        {instance.state === 'ACTIVE' && (
          <RNView style={styles.activeActions}>
            <Pressable
              onPress={onViewAttendance}
              style={({ pressed }) => [styles.attendanceBtn, pressed && styles.attendanceBtnPressed]}
            >
              <Ionicons name="checkmark-done-outline" size={16} color="#FFFFFF" />
              <Text style={styles.attendanceBtnText}>
                {t('manager.dashboard.markAttendance', { defaultValue: 'Mark Attendance' })}
              </Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.endBtn, pressed && styles.endBtnPressed]}
            >
              <Ionicons name="stop-circle-outline" size={16} color="#DC2626" />
              <Text style={styles.endBtnText}>
                {t('manager.dashboard.endSession', { defaultValue: 'End Session' })}
              </Text>
            </Pressable>
          </RNView>
        )}

        {/* CLOSED: View Attendance (read-only) */}
        {instance.state === 'CLOSED' && (
          <Pressable
            onPress={onViewAttendance}
            style={({ pressed }) => [styles.viewAttendanceBtn, pressed && styles.viewAttendanceBtnPressed]}
          >
            <Ionicons name="document-text-outline" size={16} color="#3B82F6" />
            <Text style={styles.viewAttendanceBtnText}>
              {t('manager.sessionDetail.viewAttendance', { defaultValue: 'View Attendance' })}
            </Text>
            <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={14} color="#93C5FD" />
          </Pressable>
        )}
      </RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  // Statistics
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // Instance cards
  instanceCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  instanceStripe: {
    width: 4,
    borderTopStartRadius: 14,
    borderBottomStartRadius: 14,
  },
  instanceBody: { flex: 1, padding: 14, gap: 10 },
  instanceTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  instanceMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  actionRow: { alignSelf: 'flex-start' },
  activeActions: { flexDirection: 'row', gap: 8 },
  attendanceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#10B981',
    borderRadius: 10,
  },
  attendanceBtnPressed: { backgroundColor: '#059669' },
  attendanceBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  endBtnPressed: { backgroundColor: '#FEE2E2' },
  endBtnText: { fontSize: 13, fontWeight: '600', color: '#DC2626' },
  // Closed → view attendance
  viewAttendanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  viewAttendanceBtnPressed: { backgroundColor: '#DBEAFE' },
  viewAttendanceBtnText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#3B82F6' },
});
