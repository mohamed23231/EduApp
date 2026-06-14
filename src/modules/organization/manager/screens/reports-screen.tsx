import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, View as RNView } from 'react-native';
import { ActivityIndicator, Pressable, ScrollView, Text, TopBar, View } from '@/components/ui';
import colors from '@/components/ui/colors';
import { TeacherPerformanceSection } from '../components/reports/teacher-performance-section';
import { useOrganizations, useOrgStats } from '../hooks';
import { useManagerStore } from '../store/manager-store';

const RANGE_OPTIONS = ['week', 'month', 'term'] as const;

export function ReportsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const setActiveOrgId = useManagerStore.use.setActiveOrgId();
  const organizationsQuery = useOrganizations();
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>('month');
  const { overview, teachers } = useOrgStats(activeOrgId, range);

  useEffect(() => {
    if (!activeOrgId && organizationsQuery.data?.data[0]) {
      setActiveOrgId(organizationsQuery.data.data[0].id);
    }
  }, [activeOrgId, organizationsQuery.data, setActiveOrgId]);

  const onRefresh = useCallback(() => {
    overview.refetch();
    teachers.refetch();
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
            refreshing={overview.isRefetching || teachers.isRefetching}
            onRefresh={onRefresh}
          />
        )}
      >
        <Text style={{ marginTop: 8, fontSize: 16, color: colors.neutral.inkMuted }}>
          {t('manager.reports.subtitle', {
            defaultValue:
              'Attendance, completion, and teacher performance trends for your organization.',
          })}
        </Text>
        <View style={{ marginTop: 20, flexDirection: 'row', gap: 8 }}>
          {RANGE_OPTIONS.map((option) => {
            const selected = range === option;
            const label = t(`manager.reports.range.${option}`, { defaultValue: option });
            return (
              <Pressable
                key={option}
                onPress={() => setRange(option)}
                accessibilityLabel={label}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: selected ? colors.brand.primary : colors.neutral.card,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    textTransform: 'capitalize',
                    color: selected ? colors.neutral.white : colors.neutral.inkMuted,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {[
            [
              t('manager.reports.cards.totalSessions', { defaultValue: 'Total sessions' }),
              overview.data?.totalSessions ?? 0,
            ],
            [
              t('manager.reports.cards.completed', { defaultValue: 'Completed' }),
              overview.data?.completedSessions ?? 0,
            ],
            [
              t('manager.reports.cards.attendanceRate', { defaultValue: 'Attendance rate' }),
              `${overview.data?.averageAttendanceRate ?? 0}%`,
            ],
            [
              t('manager.reports.cards.averageRating', { defaultValue: 'Average rating' }),
              overview.data?.averagePerformanceRating ?? 0,
            ],
            [
              t('manager.reports.cards.absentCount', { defaultValue: 'Absent' }),
              overview.data?.absentCount ?? 0,
            ],
            [
              t('manager.reports.cards.excusedCount', { defaultValue: 'Excused' }),
              overview.data?.excusedCount ?? 0,
            ],
          ].map(([label, value]) => (
            <View
              key={String(label)}
              style={{
                minWidth: '47%',
                flex: 1,
                borderRadius: 16,
                backgroundColor: colors.neutral.card,
                padding: 16,
              }}
            >
              <Text style={{ fontSize: 14, color: colors.neutral.inkMuted }}>{label}</Text>
              <Text style={{ marginTop: 8, fontSize: 30, fontWeight: '600', color: colors.neutral.ink }}>
                {value}
              </Text>
            </View>
          ))}
        </View>
        <TeacherPerformanceSection teachers={teachers.data?.data ?? []} />
      </ScrollView>
    </RNView>
  );
}
