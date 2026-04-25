import type { OrgSessionTemplate } from '../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, I18nManager, RefreshControl, StyleSheet } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { useModal } from '@/components/ui/modal';
import { AppRoute } from '@/core/navigation/routes';
import { NoOrgEmptyState } from '../components';
import {
  useDeleteSession,
  useOrganizations,
  useOrgSessions,
  usePauseResumeSession,
} from '../hooks';
import { useManagerStore } from '../store/manager-store';

function formatDaysOfWeek(
  days: number[],
  t: (key: string, opts?: Record<string, string>) => string,
): string {
  const map: Record<number, string> = {
    1: t('manager.days.mon', { defaultValue: 'Mon' }),
    2: t('manager.days.tue', { defaultValue: 'Tue' }),
    3: t('manager.days.wed', { defaultValue: 'Wed' }),
    4: t('manager.days.thu', { defaultValue: 'Thu' }),
    5: t('manager.days.fri', { defaultValue: 'Fri' }),
    6: t('manager.days.sat', { defaultValue: 'Sat' }),
    7: t('manager.days.sun', { defaultValue: 'Sun' }),
  };
  return days
    .slice()
    .sort()
    .map(d => map[d] ?? '')
    .filter(Boolean)
    .join(', ');
}

function SessionCard({
  session,
  onPress,
}: {
  session: OrgSessionTemplate;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        session.isPaused && styles.cardPaused,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={session.subject}
    >
      <View style={styles.cardAccent} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardSubject} numberOfLines={1}>{session.subject}</Text>
          {session.isPaused
            ? (
                <View style={styles.pausedBadge}>
                  <Text style={styles.pausedText}>{t('manager.sessions.paused', { defaultValue: 'Paused' })}</Text>
                </View>
              )
            : null}
          <View style={styles.timePill}>
            <Ionicons name="time-outline" size={12} color="#6B7280" />
            <Text style={styles.timePillText}>{session.time}</Text>
          </View>
        </View>
        <View style={styles.cardMeta}>
          <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
          <Text style={styles.cardMetaText}>{formatDaysOfWeek(session.daysOfWeek, t)}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Ionicons name="person-outline" size={13} color="#9CA3AF" />
          <Text style={styles.cardMetaText}>{session.assignedMember.name}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Ionicons name="people-outline" size={13} color="#9CA3AF" />
          <Text style={styles.cardMetaText}>
            {t('manager.sessions.studentCount', {
              defaultValue: '{{count}} students',
              count: session.studentCount ?? session.students?.length ?? 0,
            })}
          </Text>
        </View>
      </View>
      <Ionicons
        name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
        size={18}
        color="#D1D5DB"
        style={styles.chevron}
      />
    </Pressable>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  color = '#374151',
  danger = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        danger && styles.actionRowDanger,
        pressed && { backgroundColor: danger ? '#FEF2F2' : '#F9FAFB' },
      ]}
      accessibilityRole="button"
    >
      <View style={[styles.actionIcon, { backgroundColor: danger ? '#FEF2F2' : '#F3F4F6' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.actionRowLabel, { color }]}>{label}</Text>
      <Ionicons
        name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
        size={16}
        color="#D1D5DB"
      />
    </Pressable>
  );
}

// eslint-disable-next-line max-lines-per-function
function SessionsList() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const sessionsQuery = useOrgSessions(activeOrgId);
  const deleteMutation = useDeleteSession(activeOrgId);
  const pauseResumeMutation = usePauseResumeSession(activeOrgId);
  const [selectedSession, setSelectedSession] = useState<OrgSessionTemplate | null>(null);
  const actionsSheet = useModal();

  const handleSessionPress = (session: OrgSessionTemplate) => {
    setSelectedSession(session);
    actionsSheet.present();
  };

  const handleDetails = () => {
    actionsSheet.dismiss();
    if (selectedSession) {
      router.push(AppRoute.manager.sessionDetail(selectedSession.id));
    }
  };

  const handlePauseResume = () => {
    actionsSheet.dismiss();
    if (selectedSession) {
      pauseResumeMutation.mutate({
        sessionId: selectedSession.id,
        isPaused: selectedSession.isPaused,
      });
    }
  };

  const handleDelete = () => {
    if (!selectedSession)
      return;
    Alert.alert(
      t('manager.sessions.deleteTitle', { defaultValue: 'Delete session?' }),
      t('manager.sessions.deleteMessage', {
        defaultValue:
          'This will soft-delete the session template. Existing records are preserved.',
      }),
      [
        { text: t('manager.common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('manager.sessions.deleteConfirm', { defaultValue: 'Delete' }),
          style: 'destructive',
          onPress: () => {
            actionsSheet.dismiss();
            deleteMutation.mutate(selectedSession.id);
          },
        },
      ],
    );
  };

  const onRefresh = useCallback(() => {
    sessionsQuery.refetch();
  }, [sessionsQuery]);

  if (sessionsQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-10">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (sessionsQuery.isError) {
    return (
      <View className="flex-1 items-center gap-3 py-10">
        <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
        <Text className="font-inter text-sm text-red-600">
          {t('manager.sessions.errorLoading', {
            defaultValue: 'Could not load sessions.',
          })}
        </Text>
        <Button
          variant="outline"
          size="sm"
          label={t('manager.sessions.errorRetry', { defaultValue: 'Retry' })}
          fullWidth={false}
          onPress={() => sessionsQuery.refetch()}
        />
      </View>
    );
  }

  const sessions = sessionsQuery.data?.data ?? [];

  return (
    <>
      <ScrollView
        contentContainerClassName="px-6 pb-8 pt-2"
        refreshControl={(
          <RefreshControl
            refreshing={sessionsQuery.isRefetching}
            onRefresh={onRefresh}
          />
        )}
      >
        {sessions.length === 0
          ? (
              <View className="items-center py-16">
                <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
                <Text className="font-inter mt-3 text-sm text-slate-500">
                  {t('manager.sessions.empty', {
                    defaultValue: 'No sessions yet.',
                  })}
                </Text>
              </View>
            )
          : (
              <View className="gap-3">
                {sessions.map(session => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onPress={() => handleSessionPress(session)}
                  />
                ))}
              </View>
            )}
      </ScrollView>

      <Modal
        ref={actionsSheet.ref}
        snapPoints={[280]}
        title={selectedSession?.subject ?? ''}
      >
        <View style={styles.sheetContent}>
          <ActionRow
            icon="open-outline"
            label={t('manager.sessions.actions.details', { defaultValue: 'View details' })}
            onPress={handleDetails}
          />
          <ActionRow
            icon={selectedSession?.isPaused ? 'play-outline' : 'pause-outline'}
            label={
              selectedSession?.isPaused
                ? t('manager.sessions.actions.resume', { defaultValue: 'Resume' })
                : t('manager.sessions.actions.pause', { defaultValue: 'Pause' })
            }
            onPress={handlePauseResume}
            color="#F59E0B"
          />
          <ActionRow
            icon="trash-outline"
            label={t('manager.sessions.actions.delete', { defaultValue: 'Delete' })}
            onPress={handleDelete}
            color="#DC2626"
            danger
          />
        </View>
      </Modal>
    </>
  );
}

export function SessionsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const setActiveOrgId = useManagerStore.use.setActiveOrgId();
  const organizationsQuery = useOrganizations();

  useEffect(() => {
    if (!activeOrgId && organizationsQuery.data?.data[0]) {
      setActiveOrgId(organizationsQuery.data.data[0].id);
    }
  }, [activeOrgId, organizationsQuery.data, setActiveOrgId]);

  if (!activeOrgId) {
    return <NoOrgEmptyState />;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <View className="flex-row items-center justify-between px-6 pt-6 pb-2">
        <View className="flex-1">
          <Text className="font-inter text-3xl font-semibold text-slate-900">
            {t('manager.sessions.title', { defaultValue: 'Sessions' })}
          </Text>
          <Text className="font-inter mt-1 text-base text-slate-500">
            {t('manager.sessions.subtitle', {
              defaultValue:
                'Build recurring session templates and keep teacher assignments visible.',
            })}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push(AppRoute.manager.sessionCreate)}
          className="ms-3 size-10 items-center justify-center rounded-full bg-[#3B82F6]"
          accessibilityLabel={t('manager.sessions.actions.create', {
            defaultValue: 'Create session',
          })}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={24} color="white" />
        </Pressable>
      </View>

      <SessionsList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPaused: { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' },
  cardPressed: { opacity: 0.85 },
  cardAccent: { width: 4, alignSelf: 'stretch', backgroundColor: '#3B82F6' },
  cardBody: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, gap: 5 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardSubject: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0F172A' },
  pausedBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pausedText: { fontSize: 11, color: '#92400E', fontWeight: '600' },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  timePillText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMetaText: { fontSize: 13, color: '#64748B' },
  chevron: { marginEnd: 12, flexShrink: 0 },
  // Actions sheet
  sheetContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 4 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  actionRowDanger: { marginTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#F3F4F6' },
  actionRowLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
