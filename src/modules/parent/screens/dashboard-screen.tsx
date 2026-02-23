import type { AttendanceStats, TimelineRecord } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import {
  AttendanceDonutChart,
  AttendanceStatCard,
  EmptyDashboard,
  StudentSelector,
  TimelineItem,
} from '../components';
import { useAttendanceStats, useAttendanceTimeline, useStudents } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';

type AttendanceStatsSectionProps = {
  isLoading: boolean;
  error: Error | null | undefined;
  stats: AttendanceStats | undefined;
  onRetry: () => void;
};

function AttendanceStatsSection({ isLoading, error, stats, onRetry }: AttendanceStatsSectionProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('parent.dashboard.statsTitle')}</Text>

      {isLoading && (
        <View style={styles.loadingContainer} testID="stats-skeleton">
          <ActivityIndicator size="small" />
        </View>
      )}

      {error && !isLoading && (
        <View style={styles.errorContainer} testID="stats-error">
          <Text style={styles.errorText}>{t('parent.dashboard.statsError')}</Text>
          <Button label={t('parent.common.retry')} onPress={onRetry} />
        </View>
      )}

      {stats && !isLoading && !error && (
        <View style={styles.statsContent}>
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
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t('parent.dashboard.timelineTitle')}</Text>

      {isLoading && (
        <View style={styles.loadingContainer} testID="timeline-skeleton">
          <ActivityIndicator size="small" />
        </View>
      )}

      {error && !isLoading && (
        <View style={styles.errorContainer} testID="timeline-error">
          <Text style={styles.errorText}>{t('parent.dashboard.timelineError')}</Text>
          <Button label={t('parent.common.retry')} onPress={onRetry} />
        </View>
      )}

      {timeline && !isLoading && !error && (
        <>
          {timeline.length === 0 && (
            <Text style={styles.emptyText}>{t('parent.dashboard.noTimeline')}</Text>
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

export function ParentDashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: students, isLoading, error, refetch } = useStudents();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const effectiveSelectedId = useMemo(() => {
    if (!students?.length) {
      return null;
    }
    if (selectedStudentId && students.some(s => s.id === selectedStudentId)) {
      return selectedStudentId;
    }
    return students[0].id;
  }, [students, selectedStudentId]);

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
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.centeredContainer} testID="loading-indicator">
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    const errorMessage = extractErrorMessage(error, t);
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.errorScreenContainer}>
          <Text style={styles.errorScreenText}>{errorMessage}</Text>
          <Button label={t('parent.common.retry')} onPress={() => refetch()} testID="retry-button" />
        </View>
      </SafeAreaView>
    );
  }

  if (!students?.length) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <EmptyDashboard onLinkStudent={() => router.push(AppRoute.parent.linkStudent)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('parent.dashboard.title')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push(AppRoute.parent.linkStudent)}
          testID="add-student-button"
        >
          <Ionicons name="add-circle" size={28} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.studentSelectorContainer}>
          <StudentSelector
            students={students}
            selectedId={effectiveSelectedId}
            onSelect={setSelectedStudentId}
          />
        </View>

        <AttendanceStatsSection
          isLoading={statsLoading}
          error={statsError}
          stats={stats}
          onRetry={() => refetchStats()}
        />

        <AttendanceTimelineSection
          isLoading={timelineLoading}
          error={timelineError}
          timeline={timeline}
          onRetry={() => refetchTimeline()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  studentSelectorContainer: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 8,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  statsContent: {
    alignItems: 'center',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorScreenText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
});
