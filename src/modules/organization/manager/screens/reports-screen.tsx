import type { OrgTeacherStatsItem } from '../types/manager.types';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl } from 'react-native';
import { ActivityIndicator, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { useOrganizations, useOrgStats } from '../hooks';
import { useManagerStore } from '../store/manager-store';

const RANGE_OPTIONS = ['week', 'month', 'term'] as const;

function TeacherPerformanceSection({ teachers }: { teachers: OrgTeacherStatsItem[] }) {
  const { t } = useTranslation();
  return (
    <View className="mt-5 rounded-[28px] bg-white p-5">
      <Text className="font-inter text-lg font-semibold text-slate-900">
        {t('manager.reports.teacherPerformance', { defaultValue: 'Teacher performance' })}
      </Text>
      <View className="mt-4 gap-3">
        {teachers.map(teacher => (
          <View key={teacher.memberId} className="rounded-2xl border border-slate-200 p-4">
            <Text className="font-inter text-base font-semibold text-slate-900">
              {teacher.name}
            </Text>
            <Text className="font-inter mt-1 text-sm text-slate-500">
              {t('manager.reports.teacherSummary', {
                defaultValue: '{{completed}} completed • {{attendance}}% attendance',
                completed: teacher.completedSessions,
                attendance: teacher.averageAttendanceRate,
              })}
            </Text>
            <Text className="font-inter mt-1 text-sm text-slate-500">
              {t('manager.reports.teacherRating', { defaultValue: 'Rating: {{rating}}', rating: teacher.averageRating })}
              {' • '}
              {t('manager.reports.teacherLastSession', { defaultValue: 'Last session: {{date}}', date: teacher.lastSessionDate })}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ReportsScreen() {
  const { t } = useTranslation();
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
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f5f1e8]">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1e8]">
      <ScrollView
        contentContainerClassName="px-6 py-6"
        refreshControl={<RefreshControl refreshing={overview.isRefetching || teachers.isRefetching} onRefresh={onRefresh} />}
      >
        <Text className="font-inter text-3xl font-semibold text-slate-900">
          {t('manager.reports.title', { defaultValue: 'Reports' })}
        </Text>
        <Text className="font-inter mt-2 text-base text-slate-500">
          {t('manager.reports.subtitle', { defaultValue: 'Attendance, completion, and teacher performance trends for your organization.' })}
        </Text>
        <View className="mt-5 flex-row gap-2">
          {RANGE_OPTIONS.map((option) => {
            const selected = range === option;
            return (
              <Pressable key={option} onPress={() => setRange(option)} className={`rounded-full px-4 py-2 ${selected ? 'bg-slate-900' : 'bg-white'}`}>
                <Text className={`font-inter text-sm capitalize ${selected ? 'text-white' : 'text-slate-700'}`}>
                  {t(`manager.reports.range.${option}`, { defaultValue: option })}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View className="mt-5 flex-row flex-wrap gap-3">
          {[
            [t('manager.reports.cards.totalSessions', { defaultValue: 'Total sessions' }), overview.data?.totalSessions ?? 0],
            [t('manager.reports.cards.completed', { defaultValue: 'Completed' }), overview.data?.completedSessions ?? 0],
            [t('manager.reports.cards.attendanceRate', { defaultValue: 'Attendance rate' }), `${overview.data?.averageAttendanceRate ?? 0}%`],
            [t('manager.reports.cards.averageRating', { defaultValue: 'Average rating' }), overview.data?.averagePerformanceRating ?? 0],
            [t('manager.reports.cards.absentCount', { defaultValue: 'Absent' }), overview.data?.absentCount ?? 0],
            [t('manager.reports.cards.excusedCount', { defaultValue: 'Excused' }), overview.data?.excusedCount ?? 0],
          ].map(([label, value]) => (
            <View key={String(label)} className="min-w-[47%] flex-1 rounded-[24px] bg-white p-4">
              <Text className="font-inter text-sm text-slate-500">{label}</Text>
              <Text className="font-inter mt-2 text-3xl font-semibold text-slate-900">{value}</Text>
            </View>
          ))}
        </View>
        <TeacherPerformanceSection teachers={teachers.data?.data ?? []} />
      </ScrollView>
    </SafeAreaView>
  );
}
