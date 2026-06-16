import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, View as RNView } from 'react-native';
import { ActivityIndicator, ErrorState, ScrollView, Text, TopBar } from '@/components/ui';
import colors from '@/components/ui/colors';
import { ReportRangeSelector } from '../components/reports/report-range-selector';
import { ReportStatCards } from '../components/reports/report-stat-cards';
import { TeacherPerformanceSection } from '../components/reports/teacher-performance-section';
import { useOrganizations, useOrgStats } from '../hooks';
import { useManagerStore } from '../store/manager-store';

export function ReportsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const setActiveOrgId = useManagerStore.use.setActiveOrgId();
  const organizationsQuery = useOrganizations();
  const [range, setRange] = useState<'week' | 'month' | 'term'>('month');
  const { overview, teachers } = useOrgStats(activeOrgId, range);
  const [isManualRefresh, setIsManualRefresh] = useState(false);

  useEffect(() => {
    if (!activeOrgId && organizationsQuery.data?.data[0]) {
      setActiveOrgId(organizationsQuery.data.data[0].id);
    }
  }, [activeOrgId, organizationsQuery.data, setActiveOrgId]);

  const onRefresh = useCallback(async () => {
    setIsManualRefresh(true);
    try {
      await Promise.all([overview.refetch(), teachers.refetch()]);
    }
    finally {
      setIsManualRefresh(false);
    }
  }, [overview, teachers]);

  if (overview.isLoading || teachers.isLoading) {
    return (
      <RNView style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
        <TopBar
          title={t('manager.reports.title', { defaultValue: 'Reports' })}
          onBack={() => router.back()}
        />
        <RNView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" />
        </RNView>
      </RNView>
    );
  }

  if (overview.isError || teachers.isError) {
    return (
      <RNView style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
        <TopBar
          title={t('manager.reports.title', { defaultValue: 'Reports' })}
          onBack={() => router.back()}
        />
        <RNView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ErrorState
            title={t('manager.reports.errorTitle', { defaultValue: 'Could not load reports' })}
            body={t('manager.reports.errorBody', { defaultValue: 'Something went wrong loading your reports. Please try again.' })}
            action={{ label: t('manager.common.retry', { defaultValue: 'Retry' }), onPress: onRefresh }}
          />
        </RNView>
      </RNView>
    );
  }

  return (
    <RNView style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      <TopBar
        title={t('manager.reports.title', { defaultValue: 'Reports' })}
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerClassName="px-6 py-6"
        refreshControl={(
          <RefreshControl
            refreshing={isManualRefresh}
            onRefresh={onRefresh}
          />
        )}
      >
        <Text className="mt-2 text-base" style={{ color: colors.neutral.inkMuted }}>
          {t('manager.reports.subtitle', {
            defaultValue:
              'Attendance, completion, and teacher performance trends for your organization.',
          })}
        </Text>
        <ReportRangeSelector range={range} onChange={setRange} />
        <ReportStatCards overview={overview.data} />
        <TeacherPerformanceSection teachers={teachers.data?.data ?? []} />
      </ScrollView>
    </RNView>
  );
}
