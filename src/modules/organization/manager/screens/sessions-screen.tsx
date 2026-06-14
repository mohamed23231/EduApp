import type { OrgSessionTemplate } from '../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, I18nManager, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Button,
  EmptyState,
  Modal,
  Pressable,
  Text,
} from '@/components/ui';
import colors from '@/components/ui/colors';
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

function SessionRow({ session, onPress }: { session: OrgSessionTemplate; onPress: () => void }) {
  const { t } = useTranslation();
  const isPaused = session.isPaused;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        backgroundColor: pressed ? colors.neutral.cardWarm : colors.neutral.card,
        borderWidth: 1.5,
        borderColor: isPaused ? colors.semantic.excused : colors.neutral.rule,
        borderRadius: 18,
        opacity: isPaused ? 0.85 : 1,
      })}
      accessibilityRole="button"
      accessibilityLabel={session.subject}
    >
      {/* Time block */}
      <View style={{ width: 56, alignItems: 'center', paddingVertical: 6, backgroundColor: colors.neutral.paper, borderRadius: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.neutral.ink, letterSpacing: -0.3 }}>
          {session.time}
        </Text>
        <Text style={{ fontSize: 9, color: colors.neutral.inkMuted, fontWeight: '600', marginTop: 2, letterSpacing: 1 }}>
          {session.durationMinutes ?? 60}
          M
        </Text>
      </View>

      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.neutral.ink, letterSpacing: -0.2, flex: 1 }} numberOfLines={1}>
            {session.subject}
          </Text>
          {isPaused && (
            <View style={{ backgroundColor: colors.semantic.excusedSoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, color: colors.semantic.excusedInk, fontWeight: '700' }}>
                {t('manager.sessions.paused', { defaultValue: 'Paused' })}
              </Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 12, color: colors.neutral.inkMuted, fontWeight: '500' }}>
          {session.assignedMember.name}
          {' · '}
          {formatDaysOfWeek(session.daysOfWeek, t)}
        </Text>
      </View>

      <Ionicons
        name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
        size={16}
        color={colors.neutral.inkMuted}
      />
    </Pressable>
  );
}

function ActionRow({ icon, label, onPress, color = colors.neutral.ink, danger = false }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderTopWidth: danger ? 1 : 0,
        borderTopColor: colors.neutral.rule,
        backgroundColor: pressed ? (danger ? colors.semantic.absentSoft : colors.neutral.cardWarm) : 'transparent',
      })}
      accessibilityRole="button"
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: danger ? colors.semantic.absentSoft : colors.neutral.cardWarm, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color }}>{label}</Text>
      <Ionicons
        name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
        size={16}
        color={colors.neutral.inkMuted}
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
    if (selectedSession)
      router.push(AppRoute.manager.sessionDetail(selectedSession.id));
  };

  const handlePauseResume = () => {
    actionsSheet.dismiss();
    if (selectedSession) {
      pauseResumeMutation.mutate({ sessionId: selectedSession.id, isPaused: selectedSession.isPaused });
    }
  };

  const handleDelete = () => {
    if (!selectedSession)
      return;
    Alert.alert(
      t('manager.sessions.deleteTitle', { defaultValue: 'Delete session?' }),
      t('manager.sessions.deleteMessage', { defaultValue: 'This will soft-delete the session template. Existing records are preserved.' }),
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

  const onRefresh = useCallback(() => sessionsQuery.refetch(), [sessionsQuery]);

  if (sessionsQuery.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (sessionsQuery.isError) {
    return (
      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
        <Ionicons name="alert-circle-outline" size={32} color={colors.semantic.absent} />
        <Text style={{ fontSize: 13, color: colors.semantic.absent }}>
          {t('manager.sessions.errorLoading', { defaultValue: 'Could not load sessions.' })}
        </Text>
        <Button variant="outline" size="sm" label={t('manager.sessions.errorRetry', { defaultValue: 'Retry' })} fullWidth={false} onPress={() => sessionsQuery.refetch()} />
      </View>
    );
  }

  const sessions = sessionsQuery.data?.data ?? [];

  return (
    <>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4, gap: 8 }}
        refreshControl={<RefreshControl refreshing={sessionsQuery.isRefetching} onRefresh={onRefresh} />}
      >
        {sessions.length === 0
          ? (
              <EmptyState
                title={t('manager.sessions.empty', { defaultValue: 'No sessions yet' })}
                body={t('manager.sessions.emptyHint', { defaultValue: 'Create your first session template to get started.' })}
              />
            )
          : sessions.map(session => (
              <SessionRow key={session.id} session={session} onPress={() => handleSessionPress(session)} />
            ))}
      </ScrollView>

      <Modal ref={actionsSheet.ref} snapPoints={[280]} title={selectedSession?.subject ?? ''}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 4 }}>
          <ActionRow
            icon="open-outline"
            label={t('manager.sessions.actions.details', { defaultValue: 'View details' })}
            onPress={handleDetails}
          />
          <ActionRow
            icon={selectedSession?.isPaused ? 'play-outline' : 'pause-outline'}
            label={selectedSession?.isPaused
              ? t('manager.sessions.actions.resume', { defaultValue: 'Resume' })
              : t('manager.sessions.actions.pause', { defaultValue: 'Pause' })}
            onPress={handlePauseResume}
            color={colors.semantic.excused}
          />
          <ActionRow
            icon="trash-outline"
            label={t('manager.sessions.actions.delete', { defaultValue: 'Delete' })}
            onPress={handleDelete}
            color={colors.semantic.absent}
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
  const insets = useSafeAreaInsets();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const setActiveOrgId = useManagerStore.use.setActiveOrgId();
  const organizationsQuery = useOrganizations();
  const sessionsQuery = useOrgSessions(activeOrgId);
  const totalCount = sessionsQuery.data?.meta?.total ?? sessionsQuery.data?.data?.length ?? 0;

  useEffect(() => {
    if (!activeOrgId && organizationsQuery.data?.data[0]) {
      setActiveOrgId(organizationsQuery.data.data[0].id);
    }
  }, [activeOrgId, organizationsQuery.data, setActiveOrgId]);

  if (!activeOrgId) {
    return <NoOrgEmptyState />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral.paper }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: colors.neutral.inkMuted, fontWeight: '500' }}>
            {t('manager.sessions.countLabel', { count: totalCount, defaultValue: '{{count}} scheduled' })}
          </Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.neutral.ink, letterSpacing: -0.5, marginTop: 2 }}>
            {t('manager.sessions.title', { defaultValue: 'Sessions' })}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push(AppRoute.manager.sessionCreate)}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: pressed ? colors.brand.primaryDeep : colors.brand.primary,
            alignItems: 'center',
            justifyContent: 'center',
          })}
          accessibilityLabel={t('manager.sessions.actions.create', { defaultValue: 'Create session' })}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={24} color={colors.neutral.ink} />
        </Pressable>
      </View>

      <SessionsList />
    </View>
  );
}
