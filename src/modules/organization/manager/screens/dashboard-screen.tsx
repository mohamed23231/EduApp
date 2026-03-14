import type { OrgSessionInstance, OrgStatsOverview, OrgTeacherStatsItem } from '../types/manager.types';
import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl } from 'react-native';
import { ActivityIndicator, Button, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import { OnboardingWizard, TrialExpiredBanner } from '../components';
import { useOrganization, useOrganizations, useOrgInstances, useOrgStats } from '../hooks';
import { useManagerStore } from '../store/manager-store';

function StatCards({ overview, teacherCount }: { overview: OrgStatsOverview | undefined; teacherCount: number }) {
  const { t } = useTranslation();
  const cards = [
    { label: t('manager.dashboard.cards.students', { defaultValue: 'Students' }), value: overview?.activeStudents ?? 0 },
    { label: t('manager.dashboard.cards.todaySessions', { defaultValue: 'Today' }), value: overview?.todaySessions ?? 0 },
    { label: t('manager.dashboard.cards.runningNow', { defaultValue: 'Running now' }), value: overview?.runningNow ?? 0 },
    { label: t('manager.dashboard.cards.absentToday', { defaultValue: 'Absent today' }), value: overview?.absentToday ?? 0 },
    { label: t('manager.dashboard.cards.activeTeachers', { defaultValue: 'Active teachers' }), value: teacherCount },
  ];
  return (
    <View className="mt-2 flex-row flex-wrap gap-3">
      {cards.map(card => (
        <View key={card.label} className="min-w-[47%] flex-1 rounded-[24px] bg-white p-4">
          <Text className="font-inter text-sm text-slate-500">{card.label}</Text>
          <Text className="font-inter mt-2 text-3xl font-semibold text-slate-900">{card.value}</Text>
        </View>
      ))}
    </View>
  );
}

function TodaySessionsList({ instances, today }: { instances: OrgSessionInstance[]; today: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const todayInstances = instances.filter(i => i.date === today);
  const stateColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    active: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-red-100 text-red-700',
    cancelled: 'bg-amber-100 text-amber-700',
  };
  return (
    <View className="mt-5 rounded-[28px] bg-white p-5">
      <View className="flex-row items-center justify-between">
        <Text className="font-inter text-xl font-semibold text-slate-900">
          {t('manager.dashboard.todayTitle', { defaultValue: 'Today\'s sessions' })}
        </Text>
        <Button variant="ghost" label={t('manager.dashboard.viewAll', { defaultValue: 'View all' })} fullWidth={false} onPress={() => router.push('/(manager)/(tabs)/sessions')} />
      </View>
      {todayInstances.length === 0
        ? <Text className="font-inter mt-3 text-sm text-slate-500">{t('manager.dashboard.noSessions', { defaultValue: 'No sessions scheduled for today yet.' })}</Text>
        : (
            <View className="mt-4 gap-3">
              {todayInstances.map((instance) => {
                const stateKey = instance.state.toLowerCase() as keyof typeof stateColors;
                const [badgeBg, badgeText] = (stateColors[stateKey] ?? 'bg-slate-100 text-slate-600').split(' ');
                return (
                  <View key={instance.id} className="rounded-2xl border border-slate-200 p-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-inter text-base font-semibold text-slate-900">{instance.subject}</Text>
                      <View className={`rounded-full px-2 py-0.5 ${badgeBg}`}>
                        <Text className={`font-inter text-xs font-medium ${badgeText}`}>{t(`manager.sessionDetail.instanceState.${stateKey}`, { defaultValue: instance.state })}</Text>
                      </View>
                    </View>
                    <Text className="font-inter mt-1 text-sm text-slate-500">
                      {instance.time}
                      {' • '}
                      {instance.assignedTeacher.name}
                    </Text>
                    <Text className="font-inter mt-1 text-sm text-slate-500">
                      {t('manager.dashboard.sessionDuration', { defaultValue: '{{minutes}} min', minutes: instance.durationMinutes })}
                      {' • '}
                      {t('manager.dashboard.sessionStudents', { defaultValue: '{{count}} students', count: instance.studentCount ?? instance.students?.length ?? 0 })}
                    </Text>
                    <Button className="mt-3" variant="outline" label={t('manager.dashboard.openSession', { defaultValue: 'Open session' })} onPress={() => router.push(`/(manager)/sessions/${instance.templateId}`)} />
                  </View>
                );
              })}
            </View>
          )}
    </View>
  );
}

export function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const setActiveOrgId = useManagerStore.use.setActiveOrgId();
  const setOrgDetails = useManagerStore.use.setOrgDetails();
  const organizationsQuery = useOrganizations();
  const organizationQuery = useOrganization(activeOrgId);
  const stats = useOrgStats(activeOrgId, 'month');
  const today = new Date().toISOString().slice(0, 10);
  const instancesQuery = useOrgInstances(activeOrgId, { date: today });

  // All hooks before any early returns
  const onRefresh = useCallback(() => {
    organizationQuery.refetch();
    stats.overview.refetch();
    stats.teachers.refetch();
    instancesQuery.refetch();
  }, [organizationQuery, stats.overview, stats.teachers, instancesQuery]);

  useEffect(() => {
    if (!activeOrgId && organizationsQuery.data?.data[0]) {
      setActiveOrgId(organizationsQuery.data.data[0].id);
    }
  }, [activeOrgId, organizationsQuery.data, setActiveOrgId]);

  useEffect(() => {
    if (organizationQuery.data) {
      setOrgDetails(organizationQuery.data);
    }
  }, [organizationQuery.data, setOrgDetails]);

  if (organizationsQuery.data && organizationsQuery.data.data.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#f5f1e8] px-6 py-8">
        <View className="rounded-[28px] bg-[#102820] p-6">
          <Text className="font-inter text-3xl font-semibold text-[#f6efe2]">{t('manager.dashboard.emptyTitle', { defaultValue: 'No organization yet' })}</Text>
          <Text className="font-inter mt-2 text-base text-[#dbe7df]">{t('manager.dashboard.emptyCopy', { defaultValue: 'Create your first organization to unlock the manager dashboard.' })}</Text>
          <Button className="mt-4" label={t('manager.setup.submit', { defaultValue: 'Create organization' })} onPress={() => router.push(AppRoute.manager.setup)} />
        </View>
      </SafeAreaView>
    );
  }

  if (organizationQuery.isLoading || stats.overview.isLoading || instancesQuery.isLoading) {
    return <SafeAreaView className="flex-1 items-center justify-center bg-[#f5f1e8]"><ActivityIndicator size="large" /></SafeAreaView>;
  }

  const organization = organizationQuery.data;
  const teacherStats = stats.teachers.data?.data ?? [] as OrgTeacherStatsItem[];
  const isRefreshing = organizationQuery.isRefetching || stats.overview.isRefetching || instancesQuery.isRefetching;

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1e8]">
      <ScrollView contentContainerClassName="px-6 py-6" refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
        <View className="rounded-[32px] bg-[#102820] p-6">
          <Text className="font-inter text-sm tracking-[1.6px] text-[#95d5b2] uppercase">{organization?.name ?? t('manager.common.loading', { defaultValue: 'Loading...' })}</Text>
          <Text className="font-inter mt-2 text-3xl font-semibold text-[#f6efe2]">{t('manager.dashboard.title', { defaultValue: 'Manager dashboard' })}</Text>
          <Text className="font-inter mt-3 text-base/6 text-[#dbe7df]">{t('manager.dashboard.subtitle', { defaultValue: 'Keep today moving, track usage, and unblock your team before sessions start.' })}</Text>
        </View>
        <View className="mt-5">
          <TrialExpiredBanner visible={organization?.entitlementSource === 'expired'} onCreateNewOrg={() => router.push(AppRoute.manager.setup)} />
        </View>
        <StatCards overview={stats.overview.data} teacherCount={teacherStats.length} />
        {organization && (organization.currentStudents === 0 || organization.currentSessions === 0) && (
          <View className="mt-5">
            <OnboardingWizard steps={[
              { title: t('manager.wizard.steps.students.title', { defaultValue: 'Add your first student' }), description: t('manager.wizard.steps.students.copy', { defaultValue: 'Create at least one student so sessions and attendance have real rosters.' }), ctaLabel: t('manager.wizard.steps.students.cta', { defaultValue: 'Open students' }), onPress: () => router.push('/(manager)/(tabs)/students'), done: organization.currentStudents > 0 },
              { title: t('manager.wizard.steps.teachers.title', { defaultValue: 'Invite or assign a teacher' }), description: t('manager.wizard.steps.teachers.copy', { defaultValue: 'Invite teachers now, or assign sessions to yourself as the owner to get started quickly.' }), ctaLabel: t('manager.wizard.steps.teachers.cta', { defaultValue: 'Open teachers' }), onPress: () => router.push('/(manager)/(tabs)/teachers'), done: teacherStats.length > 0 },
              { title: t('manager.wizard.steps.sessions.title', { defaultValue: 'Create the first session' }), description: t('manager.wizard.steps.sessions.copy', { defaultValue: 'Once students and a teacher are ready, schedule the recurring session template.' }), ctaLabel: t('manager.wizard.steps.sessions.cta', { defaultValue: 'Open sessions' }), onPress: () => router.push('/(manager)/(tabs)/sessions'), done: organization.currentSessions > 0 },
            ]}
            />
          </View>
        )}
        <TodaySessionsList instances={instancesQuery.data?.data ?? []} today={today} />
      </ScrollView>
    </SafeAreaView>
  );
}
