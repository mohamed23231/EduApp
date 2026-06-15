/**
 * SessionDetailScreen — Manager
 * Template overview + statistics + recent instances with full actions.
 */

import type { OrgSessionInstance } from '../types/manager.types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  Text,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { Modal, useModal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast-host';
import { AppRoute } from '@/core/navigation/routes';
import { SUPPORT_WHATSAPP_URL } from '@/shared/constants/support';
import { InstanceGroupList } from '../components/session-detail/instance-group-list';
import { SessionHero } from '../components/session-detail/session-hero';
import { SessionMetaPills } from '../components/session-detail/session-meta-pills';
import { SessionStatsTiles } from '../components/session-detail/session-stats-tiles';
import {
  useCloseSession,
  useOrgInstances,
  useOrgSession,
  useStartSession,
} from '../hooks';
import { useManagerStore } from '../store/manager-store';

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

// eslint-disable-next-line max-lines-per-function
export function SessionDetailScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const toast = useToast();
  const trialModal = useModal();
  const closeModal = useModal();
  const [closePendingId, setClosePendingId] = useState<string | null>(null);

  const sessionQuery = useOrgSession(activeOrgId, params.id);
  const fromDate = daysAgo(30);
  const toDate = new Date().toISOString().slice(0, 10);
  const instancesQuery = useOrgInstances(activeOrgId, { from: fromDate, to: toDate });

  const startMutation = useStartSession(activeOrgId);
  const closeMutation = useCloseSession(activeOrgId);

  const template = sessionQuery.data;

  const sessionInstances = useMemo(
    () => (instancesQuery.data?.data ?? []).filter(i => i.templateId === params.id),
    [instancesQuery.data?.data, params.id],
  );
  const groupedInstances = useMemo(() => groupInstancesByDate(sessionInstances), [sessionInstances]);

  const showMutationError = useCallback(
    (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string; statusCode?: number } } };
      const apiMessage = apiError?.response?.data?.message;
      const statusCode = apiError?.response?.data?.statusCode;
      const isExpired = statusCode === 403 && (apiMessage?.includes('expired') === true || apiMessage?.includes('read-only') === true);
      if (isExpired) {
        trialModal.present();
        return;
      }
      toast.show({
        message: apiMessage ?? t('manager.sessionDetail.actionError', { defaultValue: 'This action could not be completed. Please try again.' }),
        kind: 'error',
      });
    },
    [t, toast, trialModal],
  );

  const handleCloseSession = useCallback(
    (instanceId: string) => {
      setClosePendingId(instanceId);
      closeModal.present();
    },
    [closeModal],
  );

  const handleConfirmClose = useCallback(() => {
    if (!closePendingId)
      return;
    const id = closePendingId;
    closeModal.dismiss();
    closeMutation.mutate(id, {
      onError: showMutationError,
      onSuccess: () => {
        toast.show({
          message: t('manager.dashboard.sessionClosed', { defaultValue: 'Session closed — absent students marked.' }),
          kind: 'success',
          action: {
            label: t('manager.dashboard.viewAttendance', { defaultValue: 'View' }),
            onPress: () => router.push(AppRoute.manager.attendance(id)),
          },
        });
      },
    });
  }, [closePendingId, closeModal, closeMutation, showMutationError, toast, t, router]);

  const handleViewAttendance = useCallback(
    (instanceId: string) => router.push(AppRoute.manager.attendance(instanceId)),
    [router],
  );

  if (sessionQuery.isLoading || instancesQuery.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.paper }} className="items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (sessionQuery.isError || instancesQuery.isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.paper }} className="items-center justify-center px-6">
        <Text className="text-center text-base" style={{ color: colors.semantic.absent }}>
          {t('manager.sessionDetail.loadError', { defaultValue: 'Failed to load session data.' })}
        </Text>
        <Button
          className="mt-4"
          variant="outline"
          label={t('manager.studentDetail.retry', { defaultValue: 'Retry' })}
          fullWidth={false}
          onPress={() => {
            sessionQuery.refetch();
            instancesQuery.refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  const studentCount = template?.studentCount ?? template?.students?.length ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      <ScrollView contentContainerClassName="pb-10">

        {/* Hero card */}
        <View className="pt-5">
          <SessionHero
            subject={template?.subject ?? t('manager.sessionDetail.title', { defaultValue: 'Session detail' })}
            status={template?.isPaused ? 'CLOSED' : 'ACTIVE'}
            time={template?.time}
            durationMinutes={template?.durationMinutes}
            teacherName={template?.assignedMember.name}
          />
        </View>

        {template && (
          <SessionMetaPills
            daysOfWeek={template.daysOfWeek}
            studentCount={studentCount}
            isPaused={template.isPaused ?? false}
          />
        )}

        {sessionInstances.length > 0 && (
          <SessionStatsTiles instances={sessionInstances} />
        )}

        <InstanceGroupList
          groups={groupedInstances}
          onStart={id => startMutation.mutate(id, {
            onError: showMutationError,
            onSuccess: () => toast.show({ message: t('manager.dashboard.sessionStarted', { defaultValue: 'Session started.' }), kind: 'success' }),
          })}
          onClose={handleCloseSession}
          onViewAttendance={handleViewAttendance}
          t={t}
        />
      </ScrollView>

      {/* Trial expired sheet */}
      <Modal ref={trialModal.ref} snapPoints={['32%']} title={t('manager.trial.expiredTitle', { defaultValue: 'Trial expired' })}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
          <Text style={{ fontSize: 14, color: colors.neutral.inkMuted, lineHeight: 20 }}>
            {t('manager.trial.expiredMessage', { defaultValue: 'This organization is read-only. Contact support to activate a subscription.' })}
          </Text>
          <Pressable
            onPress={() => {
              trialModal.dismiss();
              router.push(AppRoute.manager.setup);
            }}
            style={({ pressed }) => ({ padding: 14, borderRadius: 12, backgroundColor: pressed ? colors.neutral.cardWarm : colors.neutral.card, borderWidth: 1, borderColor: colors.neutral.rule })}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.neutral.ink, textAlign: 'center' }}>
              {t('manager.trial.createNewOrg', { defaultValue: 'Create new org' })}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => { void Linking.openURL(SUPPORT_WHATSAPP_URL); }}
            style={({ pressed }) => ({ padding: 14, borderRadius: 12, backgroundColor: pressed ? colors.brand.primary : colors.brand.primary })}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff', textAlign: 'center' }}>
              {t('manager.trial.contactSupport', { defaultValue: 'Contact support' })}
            </Text>
          </Pressable>
        </View>
      </Modal>

      {/* Close session confirm sheet */}
      <Modal ref={closeModal.ref} snapPoints={['30%']} title={t('manager.sessionDetail.closeWarningTitle', { defaultValue: 'Close session' })}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
          <Text style={{ fontSize: 14, color: colors.neutral.inkMuted, lineHeight: 20 }}>
            {t('manager.sessionDetail.closeWarning', { count: 0, defaultValue: 'Unmarked students will be auto-marked as absent.' })}
          </Text>
          <Pressable
            onPress={handleConfirmClose}
            style={({ pressed }) => ({ padding: 14, borderRadius: 12, backgroundColor: pressed ? colors.semantic.absentSoft : colors.semantic.absent })}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff', textAlign: 'center' }}>
              {t('manager.sessionDetail.closeConfirm', { defaultValue: 'Confirm' })}
            </Text>
          </Pressable>
          <Pressable
            onPress={closeModal.dismiss}
            style={({ pressed }) => ({ padding: 14, borderRadius: 12, backgroundColor: pressed ? colors.neutral.cardWarm : colors.neutral.card, borderWidth: 1, borderColor: colors.neutral.rule })}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.neutral.ink, textAlign: 'center' }}>
              {t('manager.common.cancel', { defaultValue: 'Cancel' })}
            </Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
