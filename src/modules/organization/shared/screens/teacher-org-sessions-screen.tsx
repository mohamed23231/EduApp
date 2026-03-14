import type { TeacherOrgInstance } from '../services/teacher-org-api.service';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl } from 'react-native';
import { ActivityIndicator, Button, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { useCloseOrgInstance, useMyOrgInstances, useStartOrgInstance } from '../hooks/use-teacher-org-sessions';

type InstanceCardProps = {
  instance: TeacherOrgInstance;
  orgName: string;
  onStart: (id: string) => void;
  onClose: (id: string) => void;
  isStarting: boolean;
  isClosing: boolean;
};

function InstanceCard({ instance, orgName, onStart, onClose, isStarting, isClosing }: InstanceCardProps) {
  const { t } = useTranslation();
  const stateColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    active: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-red-100 text-red-700',
    cancelled: 'bg-amber-100 text-amber-700',
  };
  const stateKey = instance.state.toLowerCase();
  const colorPair = stateColors[stateKey] ?? 'bg-slate-100 text-slate-600';
  const [badgeBg, badgeText] = colorPair.split(' ');

  return (
    <View className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-inter text-base font-semibold text-slate-900">{instance.subject}</Text>
        <View className={`rounded-full px-2 py-0.5 ${badgeBg}`}>
          <Text className={`font-inter text-xs font-medium ${badgeText}`}>{instance.state}</Text>
        </View>
      </View>
      <Text className="font-inter mt-1 text-xs font-medium text-emerald-700">{orgName}</Text>
      <Text className="font-inter mt-1 text-sm text-slate-500">
        {instance.date}
        {' · '}
        {instance.time}
      </Text>
      <Text className="font-inter mt-0.5 text-sm text-slate-500">
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

type Props = { orgId: string; orgName: string };

export function TeacherOrgSessionsScreen({ orgId, orgName }: Props) {
  const { t } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);
  const instancesQuery = useMyOrgInstances(orgId, today);
  const startMutation = useStartOrgInstance(orgId);
  const closeMutation = useCloseOrgInstance(orgId);

  const onRefresh = useCallback(() => {
    void instancesQuery.refetch();
  }, [instancesQuery]);

  if (instancesQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f5f1e8]">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const instances = instancesQuery.data?.data ?? [];
  const todayInstances = instances.filter(i => i.date === today);
  const upcomingInstances = instances.filter(i => i.date > today);

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1e8]">
      <ScrollView
        contentContainerClassName="px-6 py-6"
        refreshControl={<RefreshControl refreshing={instancesQuery.isRefetching} onRefresh={onRefresh} />}
      >
        <Text className="font-inter text-3xl font-semibold text-slate-900">{orgName}</Text>
        <Text className="font-inter mt-1 text-base text-slate-500">{t('teacherOrg.subtitle')}</Text>
        {todayInstances.length > 0 && (
          <View className="mt-5">
            <Text className="font-inter mb-3 text-lg font-semibold text-slate-900">{t('teacherOrg.today')}</Text>
            {todayInstances.map(i => (
              <InstanceCard
                key={i.id}
                instance={i}
                orgName={orgName}
                onStart={id => startMutation.mutate(id)}
                onClose={id => closeMutation.mutate(id)}
                isStarting={startMutation.isPending}
                isClosing={closeMutation.isPending}
              />
            ))}
          </View>
        )}
        {upcomingInstances.length > 0 && (
          <View className="mt-5">
            <Text className="font-inter mb-3 text-lg font-semibold text-slate-900">{t('teacherOrg.upcoming')}</Text>
            {upcomingInstances.map(i => (
              <InstanceCard
                key={i.id}
                instance={i}
                orgName={orgName}
                onStart={id => startMutation.mutate(id)}
                onClose={id => closeMutation.mutate(id)}
                isStarting={startMutation.isPending}
                isClosing={closeMutation.isPending}
              />
            ))}
          </View>
        )}
        {instances.length === 0 && (
          <Text className="font-inter mt-8 text-center text-base text-slate-500">
            {t('teacherOrg.empty')}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
