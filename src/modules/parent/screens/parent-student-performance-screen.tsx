import type { SupportedLocale } from '@/lib/date';
import type { ParentPerformanceResponse, PerformanceRecord } from '@/shared/performance';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { PressButton, SectionLabel, SegTabs } from '@/components/ui';
import colors from '@/components/ui/colors';
import { useStudentPerformance } from '@/shared/performance';
import {
  PerformanceRecordRow,
  SubjectCard,
  TeacherRow,
  WeeklyBars,
} from '../components/performance';
import { StudentHero } from '../components/student';
import { useAttendanceStats, useAttendanceTimeline, useStudentDetails } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';
import { distinctTeachers, groupBySubject, weekBuckets } from '../utils/performance-aggregates';

type TabKey = 'overview' | 'subjects' | 'timeline';

// eslint-disable-next-line max-lines-per-function
export function ParentStudentPerformanceScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId?: string; id?: string }>();
  const studentId = (params.studentId || params.id) as string;
  const isRTL = i18n?.language === 'ar';
  const locale: SupportedLocale = isRTL ? 'ar' : 'en';
  const [tab, setTab] = useState<TabKey>('overview');

  const { data: student } = useStudentDetails(studentId || '');
  const { data: stats } = useAttendanceStats(studentId || '');
  const { data: timeline } = useAttendanceTimeline(studentId || '', 1, 60);
  const {
    data: performance,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStudentPerformance(studentId, 'all', 'parent');

  const records = useMemo<PerformanceRecord[]>(
    () => (performance?.pages ?? []).flatMap(p => (p as ParentPerformanceResponse).records),
    [performance],
  );
  const subjects = useMemo(() => groupBySubject(records), [records]);
  const teachers = useMemo(() => distinctTeachers(records), [records]);
  const buckets = useMemo(() => weekBuckets(timeline ?? []), [timeline]);
  const trendKey = useMemo(() => deriveTrend(buckets), [buckets]);

  const tabLabels = useMemo(() => ({
    overview: t('parent.performance.tabOverview', 'Overview'),
    subjects: t('parent.performance.tabSubjects', 'Subjects'),
    timeline: t('parent.performance.tabTimeline', 'Timeline'),
  } as const), [t]);
  const tabValues = [tabLabels.overview, tabLabels.subjects, tabLabels.timeline] as const;
  const labelToKey = (label: string): TabKey => {
    if (label === tabLabels.subjects)
      return 'subjects';
    if (label === tabLabels.timeline)
      return 'timeline';
    return 'overview';
  };

  if (!studentId)
    return <Centered text={t('parent.common.genericError')} />;
  if (isLoading && !student) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral.paper }}
      >
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }
  if (isError && !student) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16, backgroundColor: colors.neutral.paper }}>
        <Text style={{ color: colors.semantic.absent, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>
          {extractErrorMessage(error, t)}
        </Text>
        <PressButton variant="gradient" size="md" onPress={() => refetch()} label={t('parent.common.retry')} />
      </View>
    );
  }
  if (!student)
    return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <StudentHero student={student} stats={stats} onBack={() => router.back()} isRTL={isRTL} t={t} />

        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, alignItems: 'center' }}>
          <SegTabs
            tabs={tabValues}
            active={tabLabels[tab]}
            onChange={label => setTab(labelToKey(label))}
          />
        </View>

        {tab === 'overview'
          ? (
              <>
                <WeeklyBars
                  buckets={buckets}
                  title={t('parent.performance.chartTitle', 'Attendance · 8 weeks')}
                  trend={t(`parent.performance.${trendKey}`)}
                  currentRate={Math.round(stats?.attendanceRate ?? 0)}
                  isRTL={isRTL}
                />
                <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                  <SectionLabel>{t('parent.performance.teachersLabel', 'TEACHERS')}</SectionLabel>
                </View>
                {teachers.length === 0
                  ? (
                      <Text
                        style={{
                          marginHorizontal: 24,
                          marginTop: 8,
                          color: colors.neutral.inkMuted,
                          fontSize: 13,
                          fontWeight: '500',
                          textAlign: 'center',
                        }}
                      >
                        {t('parent.performance.teachersEmpty')}
                      </Text>
                    )
                  : (
                      <View style={{ marginTop: 8 }}>
                        {teachers.map(teacher => (
                          <TeacherRow key={teacher.teacherName} teacher={teacher} isRTL={isRTL} />
                        ))}
                      </View>
                    )}
              </>
            )
          : null}

        {tab === 'subjects'
          ? (
              <View style={{ marginTop: 8 }}>
                {subjects.length === 0
                  ? (
                      <Text
                        style={{
                          marginHorizontal: 24,
                          marginTop: 8,
                          color: colors.neutral.inkMuted,
                          fontSize: 13,
                          fontWeight: '500',
                          textAlign: 'center',
                        }}
                      >
                        {t('parent.performance.subjectsEmpty')}
                      </Text>
                    )
                  : subjects.map(subject => (
                      <SubjectCard
                        key={subject.subject}
                        subject={subject}
                        isRTL={isRTL}
                        attendanceLabel={t('parent.performance.subjectAttendance', { rate: '{{rate}}' })}
                        outOfTen={t('parent.performance.outOfTen', '/ 10')}
                      />
                    ))}
              </View>
            )
          : null}

        {tab === 'timeline'
          ? (
              <View style={{ marginTop: 8 }}>
                {records.length === 0
                  ? (
                      <Text
                        style={{
                          marginHorizontal: 24,
                          marginTop: 8,
                          color: colors.neutral.inkMuted,
                          fontSize: 13,
                          fontWeight: '500',
                          textAlign: 'center',
                        }}
                      >
                        {t('parent.performance.emptyState')}
                      </Text>
                    )
                  : records.map(r => (
                      <PerformanceRecordRow
                        key={r.sessionInstanceId}
                        record={r}
                        isRTL={isRTL}
                        locale={locale}
                      />
                    ))}
                {hasNextPage
                  ? (
                      <Pressable
                        onPress={() => fetchNextPage()}
                        accessibilityRole="button"
                        style={{ alignItems: 'center', paddingVertical: 16 }}
                      >
                        {isFetchingNextPage
                          ? <ActivityIndicator size="small" color={colors.brand.primary} />
                          : (
                              <Text style={{ color: colors.brand.primary, fontWeight: '600' }}>
                                {t('parent.common.loading')}
                              </Text>
                            )}
                      </Pressable>
                    )
                  : null}
              </View>
            )
          : null}
      </ScrollView>
    </View>
  );
}

function Centered({ text }: { text: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: colors.neutral.paper }}>
      <Text style={{ color: colors.semantic.absent, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>
        {text}
      </Text>
    </View>
  );
}

function deriveTrend(buckets: { rate: number; totalCount: number }[]): 'chartTrendingUp' | 'chartTrendingDown' | 'chartTrendingFlat' {
  const valid = buckets.filter(b => b.totalCount > 0);
  if (valid.length < 2)
    return 'chartTrendingFlat';
  const half = Math.floor(valid.length / 2);
  const earlierAvg = avg(valid.slice(0, half).map(b => b.rate));
  const laterAvg = avg(valid.slice(half).map(b => b.rate));
  const diff = laterAvg - earlierAvg;
  if (diff > 5)
    return 'chartTrendingUp';
  if (diff < -5)
    return 'chartTrendingDown';
  return 'chartTrendingFlat';
}

function avg(arr: number[]): number {
  if (arr.length === 0)
    return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
