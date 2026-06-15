import type { TeacherOrgInstance } from '../services/teacher-org-api.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, RefreshControl } from 'react-native';
import { ActivityIndicator, Button, ErrorState, Pressable, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';
import { useToast } from '@/components/ui/toast-host';
import { useCloseOrgInstance, useMyOrgInstances, useStartOrgInstance } from '../hooks/use-teacher-org-sessions';

type InstanceCardProps = {
  instance: TeacherOrgInstance;
  orgName: string;
  onStart: (id: string) => void;
  onClose: (id: string) => void;
  isStarting: boolean;
  isClosing: boolean;
};

const STATE_BADGE: Record<string, { bg: string; text: string }> = {
  draft: { bg: colors.semantic.excusedSoft, text: colors.semantic.excusedInk },
  active: { bg: colors.semantic.presentSoft, text: colors.semantic.presentInk },
  closed: { bg: colors.semantic.absentSoft, text: colors.semantic.absentInk },
  cancelled: { bg: colors.semantic.excusedSoft, text: colors.semantic.excusedInk },
};

function InstanceCard({ instance, orgName, onStart, onClose, isStarting, isClosing }: InstanceCardProps) {
  const { t } = useTranslation();
  const stateKey = instance.state.toLowerCase();
  const badge = STATE_BADGE[stateKey] ?? STATE_BADGE.draft;

  return (
    <View
      className="mb-3 rounded-2xl border p-4"
      style={{ backgroundColor: colors.neutral.card, borderColor: colors.neutral.rule }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-inter text-base font-semibold" style={{ color: colors.neutral.ink }}>{instance.subject}</Text>
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: badge.bg }}>
          <Text className="font-inter text-xs font-medium" style={{ color: badge.text }}>{instance.state}</Text>
        </View>
      </View>
      <Text className="font-inter mt-1 text-xs font-medium" style={{ color: colors.brand.primaryDeep }}>{orgName}</Text>
      <Text className="font-inter mt-1 text-sm" style={{ color: colors.neutral.inkMuted }}>
        {instance.date}
        {' · '}
        {instance.time}
      </Text>
      <Text className="font-inter mt-0.5 text-sm" style={{ color: colors.neutral.inkMuted }}>
        {t('teacherOrg.duration', { min: instance.durationMinutes, n: instance.studentCount })}
      </Text>
      {instance.state === 'DRAFT' && (
        <Button
          className="mt-3"
          variant="outline"
          label={t('teacherOrg.startSession')}
          onPress={() => onStart(instance.id)}
          loading={isStarting}
        />
      )}
      {instance.state === 'ACTIVE' && (
        <Button
          className="mt-3"
          variant="outline"
          label={t('teacherOrg.closeSession')}
          onPress={() => onClose(instance.id)}
          loading={isClosing}
        />
      )}
    </View>
  );
}

type Props = { orgId: string; orgName: string; onBack?: () => void };

function BackBar({ orgName, onBack }: { orgName: string; onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center px-4 pt-2 pb-1">
      <Pressable
        onPress={onBack}
        className="size-10 items-center justify-center rounded-full"
        accessibilityRole="button"
        accessibilityLabel={t('teacherOrg.back', { defaultValue: 'Back' })}
      >
        <Ionicons
          name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
          size={24}
          color={colors.neutral.ink}
        />
      </Pressable>
      <Text className="font-inter ms-1 text-base font-semibold" style={{ color: colors.neutral.ink }} numberOfLines={1}>
        {orgName}
      </Text>
    </View>
  );
}

// eslint-disable-next-line max-lines-per-function
export function TeacherOrgSessionsScreen({ orgId, orgName, onBack }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const instancesQuery = useMyOrgInstances(orgId, today);
  const startMutation = useStartOrgInstance(orgId);
  const closeMutation = useCloseOrgInstance(orgId);

  const handleBack = useCallback(() => {
    if (onBack)
      onBack();
    else
      router.back();
  }, [onBack, router]);

  const onRefresh = useCallback(() => {
    void instancesQuery.refetch();
  }, [instancesQuery]);

  const handleActionError = useCallback(() => {
    toast.show({ message: t('teacherOrg.actionFailed', { defaultValue: 'Action failed' }), kind: 'error' });
  }, [toast, t]);

  const handleStart = useCallback(
    (id: string) => startMutation.mutate(id, { onError: handleActionError }),
    [startMutation, handleActionError],
  );
  const handleClose = useCallback(
    (id: string) => closeMutation.mutate(id, { onError: handleActionError }),
    [closeMutation, handleActionError],
  );

  if (instancesQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.neutral.paper }}>
        <BackBar orgName={orgName} onBack={handleBack} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (instancesQuery.isError) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.neutral.paper }}>
        <BackBar orgName={orgName} onBack={handleBack} />
        <View className="flex-1 items-center justify-center">
          <ErrorState
            title={t('teacherOrg.errorTitle', { defaultValue: 'Could not load sessions' })}
            body={t('teacherOrg.errorBody', { defaultValue: 'Something went wrong loading your sessions. Please try again.' })}
            action={{ label: t('teacherOrg.retry', { defaultValue: 'Retry' }), onPress: () => instancesQuery.refetch() }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const instances = instancesQuery.data?.data ?? [];
  const todayInstances = instances.filter(i => i.date === today);
  const upcomingInstances = instances.filter(i => i.date > today);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.neutral.paper }}>
      <BackBar orgName={orgName} onBack={handleBack} />
      <ScrollView
        contentContainerClassName="px-6 py-6"
        refreshControl={<RefreshControl refreshing={instancesQuery.isRefetching} onRefresh={onRefresh} />}
      >
        <Text className="font-inter text-3xl font-semibold" style={{ color: colors.neutral.ink }}>{orgName}</Text>
        <Text className="font-inter mt-1 text-base" style={{ color: colors.neutral.inkMuted }}>{t('teacherOrg.subtitle')}</Text>
        {todayInstances.length > 0 && (
          <View className="mt-5">
            <Text className="font-inter mb-3 text-lg font-semibold" style={{ color: colors.neutral.ink }}>{t('teacherOrg.today')}</Text>
            {todayInstances.map(i => (
              <InstanceCard
                key={i.id}
                instance={i}
                orgName={orgName}
                onStart={handleStart}
                onClose={handleClose}
                isStarting={startMutation.isPending}
                isClosing={closeMutation.isPending}
              />
            ))}
          </View>
        )}
        {upcomingInstances.length > 0 && (
          <View className="mt-5">
            <Text className="font-inter mb-3 text-lg font-semibold" style={{ color: colors.neutral.ink }}>{t('teacherOrg.upcoming')}</Text>
            {upcomingInstances.map(i => (
              <InstanceCard
                key={i.id}
                instance={i}
                orgName={orgName}
                onStart={handleStart}
                onClose={handleClose}
                isStarting={startMutation.isPending}
                isClosing={closeMutation.isPending}
              />
            ))}
          </View>
        )}
        {instances.length === 0 && (
          <Text className="font-inter mt-8 text-center text-base" style={{ color: colors.neutral.inkMuted }}>
            {t('teacherOrg.empty')}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
