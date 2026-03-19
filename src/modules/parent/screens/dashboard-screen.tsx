import type { AttendanceStats, Student, TimelineRecord } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, I18nManager, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import {
  AttendanceDonutChart,
  AttendanceStatCard,
  EmptyDashboard,
  NotificationBell,
  StudentSelector,
  TimelineItem,
} from '../components';
import { useAttendanceStats, useAttendanceTimeline, useStudents } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';
import { useNotificationStore } from '../store/use-notification-store';

type AttendanceStatsSectionProps = {
  isLoading: boolean;
  error: Error | null | undefined;
  stats: AttendanceStats | undefined;
  onRetry: () => void;
};

function TeacherInfoRow({ student, t }: { student: Student; t: (key: string) => string }) {
  if (!student.teacherName)
    return null;
  return (
    <View className="mb-4 flex-row items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <View className="size-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
        <Ionicons name="school-outline" size={16} color="#3478F6" />
      </View>
      <View className="flex-1">
        <Text className="text-[11px] font-medium tracking-wider text-gray-400 uppercase">
          {t('parent.dashboard.teacherLabel')}
        </Text>
        <Text className="mt-px text-[15px] font-semibold text-gray-900" numberOfLines={1}>
          {student.teacherName}
        </Text>
      </View>
    </View>
  );
}

function AttendanceStatsSection({ isLoading, error, stats, onRetry }: AttendanceStatsSectionProps) {
  const { t } = useTranslation();
  return (
    <View className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
      <Text className="mb-3 text-base font-semibold text-gray-900">
        {t('parent.dashboard.statsTitle')}
      </Text>

      {isLoading && (
        <View className="items-center py-6" testID="stats-skeleton">
          <ActivityIndicator size="small" />
        </View>
      )}

      {error && !isLoading && (
        <View className="rounded-lg bg-red-50 p-3" testID="stats-error">
          <Text className="mb-2 text-sm text-red-500">
            {t('parent.dashboard.statsError')}
          </Text>
          <Button label={t('parent.common.retry')} onPress={onRetry} size="sm" />
        </View>
      )}

      {stats && !isLoading && !error && (
        <View className="items-center">
          <AttendanceDonutChart attendanceRate={stats.attendanceRate} size={160} />
          <AttendanceStatCard
            present={stats.present}
            absent={stats.absent}
            excused={stats.excused}
          />
        </View>
      )}
    </View>
  );
}

type AttendanceTimelineSectionProps = {
  isLoading: boolean;
  error: Error | null | undefined;
  timeline: TimelineRecord[] | undefined;
  onRetry: () => void;
};

function AttendanceTimelineSection({ isLoading, error, timeline, onRetry }: AttendanceTimelineSectionProps) {
  const { t } = useTranslation();
  return (
    <View className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
      <Text className="mb-3 text-base font-semibold text-gray-900">
        {t('parent.dashboard.timelineTitle')}
      </Text>

      {isLoading && (
        <View className="items-center py-6" testID="timeline-skeleton">
          <ActivityIndicator size="small" />
        </View>
      )}

      {error && !isLoading && (
        <View className="rounded-lg bg-red-50 p-3" testID="timeline-error">
          <Text className="mb-2 text-sm text-red-500">
            {t('parent.dashboard.timelineError')}
          </Text>
          <Button label={t('parent.common.retry')} onPress={onRetry} size="sm" />
        </View>
      )}

      {timeline && !isLoading && !error && (
        <>
          {timeline.length === 0 && (
            <Text className="py-4 text-center text-sm text-gray-500">
              {t('parent.dashboard.noTimeline')}
            </Text>
          )}
          {timeline.slice(0, 5).map(record => (
            <TimelineItem
              key={`${record.date}-${record.time}-${record.status}`}
              date={record.date}
              time={record.time}
              status={record.status}
              excuseNote={record.excuseNote}
            />
          ))}
        </>
      )}
    </View>
  );
}

type PerformanceCardProps = {
  studentId: string;
};

function PerformanceCard({ studentId }: PerformanceCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Pressable
      className="mb-4 flex-row items-center gap-3 rounded-xl border border-gray-200 bg-white p-4"
      onPress={() => router.push(AppRoute.parent.studentPerformance(studentId))}
      testID="performance-button"
    >
      <View className="size-10 items-center justify-center rounded-[10px] bg-blue-50">
        <Ionicons name="stats-chart" size={20} color="#3478F6" />
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-gray-900">
          {t('parent.dashboard.performanceTitle')}
        </Text>
        <Text className="mt-0.5 text-[13px] text-gray-500">
          {t('parent.dashboard.performanceSubtitle')}
        </Text>
      </View>
      <Ionicons
        name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
        size={20}
        color="#9CA3AF"
      />
    </Pressable>
  );
}

function useDashboardState() {
  const { data: students, isLoading, error, refetch } = useStudents();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const effectiveSelectedId = useMemo(() => {
    if (!students?.length)
      return null;
    if (selectedStudentId && students.some(s => s.id === selectedStudentId)) {
      return selectedStudentId;
    }
    return students[0].id;
  }, [students, selectedStudentId]);

  const selectedStudent = useMemo(
    () => students?.find(s => s.id === effectiveSelectedId) ?? null,
    [students, effectiveSelectedId],
  );

  return { students, isLoading, error, refetch, effectiveSelectedId, selectedStudent, setSelectedStudentId };
}

export function ParentDashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    students,
    isLoading,
    error,
    refetch,
    effectiveSelectedId,
    selectedStudent,
    setSelectedStudentId,
  } = useDashboardState();
  const unreadCount = useNotificationStore.use.unreadCount();

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useAttendanceStats(effectiveSelectedId ?? '');

  const {
    data: timeline,
    isLoading: timelineLoading,
    error: timelineError,
    refetch: refetchTimeline,
  } = useAttendanceTimeline(effectiveSelectedId ?? '');

  if (isLoading) {

    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-white">
        <View className="flex-1 items-center justify-center" testID="loading-indicator">
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {

    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-4 text-center text-base text-red-500">{extractErrorMessage(error, t)}</Text>
          <Button label={t('parent.common.retry')} onPress={() => refetch()} testID="retry-button" />
        </View>
      </SafeAreaView>
    );
  }

  if (!students?.length) {

    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-white">
        <EmptyDashboard onLinkStudent={() => router.push(AppRoute.parent.linkStudent)} />
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-white">
      <View className="flex-row items-center justify-between bg-white p-4">
        <Text className="text-[22px] font-bold text-gray-900">{t('parent.dashboard.title')}</Text>
        <View className="flex-row items-center gap-2">
          <NotificationBell unreadCount={unreadCount} onPress={() => router.push(AppRoute.parent.notifications)} />
          <Pressable className="p-1" onPress={() => router.push(AppRoute.parent.linkStudent)} testID="add-student-button">
            <Ionicons name="add-circle" size={28} color="#3478F6" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <View className="mb-4">
          <StudentSelector students={students} selectedId={effectiveSelectedId} onSelect={setSelectedStudentId} />
        </View>
        {selectedStudent && <TeacherInfoRow student={selectedStudent} t={t} />}
        <AttendanceStatsSection isLoading={statsLoading} error={statsError} stats={stats} onRetry={() => refetchStats()} />
        <AttendanceTimelineSection isLoading={timelineLoading} error={timelineError} timeline={timeline} onRetry={() => refetchTimeline()} />
        {effectiveSelectedId && <PerformanceCard studentId={effectiveSelectedId} />}
      </ScrollView>
    </SafeAreaView>
  );
}
