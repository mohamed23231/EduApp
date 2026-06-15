import type { TimelineRecord } from '../types';
import type { SupportedLocale } from '@/lib/date';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  EmptyState,
  ErrorState,
  Icon,
  PressButton,
  SectionLabel,
  TabaMark,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { AppRoute } from '@/core/navigation/routes';
import { EmptyDashboard, NotificationBell } from '../components';
import {
  ChildSwitcher,
  DashboardSkeleton,
  ParentHero,
  ThisWeekTiles,
  TimelineRow,
} from '../components/dashboard';
import {
  useChildSummaryHero,
  useCurrentSession,
  useStudents,
  useUpcomingSessions,
} from '../hooks';
import { extractErrorMessage } from '../services/error-utils';
import { useNotificationStore } from '../store/use-notification-store';
import { deriveTodayRecord } from '../utils/dashboard-helpers';

/**
 * ParentDashboardScreen — Phase 8 wrapper. Composes:
 *   - ChildSwitcher (horizontal pill row of linked children)
 *   - ParentHero (live → next → past → none state machine)
 *   - ThisWeekTiles (attendance %, streak, avg rating)
 *   - RECENT timeline (3 hairline-divided rows)
 *
 * All sub-components live in `../components/dashboard/` to keep this file
 * under the 300-line cap. Pure data derivation lives in `../utils/dashboard-helpers`.
 */

// eslint-disable-next-line max-lines-per-function
export function ParentDashboardScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = i18n?.language === 'ar';
  const locale: SupportedLocale = isRTL ? 'ar' : 'en';

  const {
    data: students,
    isLoading: studentsLoading,
    error: studentsError,
    refetch: refetchStudents,
  } = useStudents();
  const unreadCount = useNotificationStore.use.unreadCount();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const effectiveSelectedId = useMemo(() => {
    if (!students?.length)
      return null;
    if (selectedStudentId && students.some(s => s.id === selectedStudentId))
      return selectedStudentId;
    return students[0].id;
  }, [students, selectedStudentId]);

  const {
    student: selectedStudent,
    attendanceStats,
    recentTimeline,
    isLoading: heroLoading,
    error: heroError,
  } = useChildSummaryHero(effectiveSelectedId ?? '');
  const { data: currentSession } = useCurrentSession(effectiveSelectedId ?? '');
  const { data: upcomingSessions } = useUpcomingSessions(effectiveSelectedId ?? '', 1);
  const upcomingSession = upcomingSessions?.[0];

  if (studentsLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.neutral.paper, paddingTop: insets.top }}>
        <DashboardSkeleton testID="loading-indicator" />
      </View>
    );
  }

  if (studentsError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.neutral.paper, paddingTop: insets.top }}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ErrorState
            title={t('parent.dashboard.errorTitle', 'Could not load your family')}
            body={extractErrorMessage(studentsError, t)}
            action={{ label: t('parent.common.retry', 'Retry'), onPress: () => refetchStudents() }}
            testID="retry-button"
          />
        </View>
      </View>
    );
  }

  if (!students?.length) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.neutral.paper, paddingTop: insets.top }}>
        <EmptyDashboard onLinkStudent={() => router.push(AppRoute.parent.linkStudent)} />
      </View>
    );
  }

  const studentFirstName = selectedStudent?.fullName?.split(' ')[0] ?? '';
  const todayRecord = deriveTodayRecord(recentTimeline);

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TabaMark size={36} frame="ink" />
            <View>
              <Text
                style={{
                  color: colors.neutral.inkMuted,
                  fontSize: 12,
                  fontWeight: '600',
                  letterSpacing: 0.2,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {t('parent.dashboard.greeting', 'Hi there')}
              </Text>
              <Text
                style={{
                  color: colors.neutral.ink,
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.4,
                  marginTop: 1,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {t('parent.dashboard.familyLabel', 'Family')}
              </Text>
            </View>
          </View>
          <NotificationBell
            unreadCount={unreadCount}
            onPress={() => router.push(AppRoute.parent.notifications)}
          />
        </View>

        <View style={{ marginBottom: 14 }}>
          <ChildSwitcher
            students={students}
            selectedId={effectiveSelectedId}
            onSelect={setSelectedStudentId}
            onAddChild={() => router.push(AppRoute.parent.linkStudent)}
          />
        </View>

        {heroLoading && !selectedStudent
          ? (
              <View style={{ marginHorizontal: 16, padding: 22, borderRadius: 24, backgroundColor: colors.neutral.ink, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.brand.primary} />
              </View>
            )
          : (
              <ParentHero
                studentFirstName={studentFirstName}
                currentSession={currentSession}
                upcomingSession={upcomingSession}
                todayRecord={todayRecord}
                attendanceRate={attendanceStats?.attendanceRate}
                isRTL={isRTL}
                locale={locale}
                t={t}
              />
            )}

        {heroError
          ? (
              <Text
                style={{
                  marginHorizontal: 16,
                  marginTop: 10,
                  color: colors.semantic.absent,
                  fontSize: 13,
                  fontWeight: '600',
                  textAlign: 'center',
                }}
                testID="hero-error"
              >
                {t('parent.dashboard.statsError')}
              </Text>
            )
          : null}

        <ThisWeekTiles stats={attendanceStats} isRTL={isRTL} t={t} />

        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <SectionLabel>{t('parent.dashboard.timelineSectionLabel', 'RECENT')}</SectionLabel>
        </View>

        <View style={{ marginHorizontal: 16, marginTop: 8 }}>
          {recentTimeline.length === 0
            ? (
                <EmptyState
                  scope="parentNoAttendance"
                  title={t('parent.dashboard.noTimelineTitle', 'No recent activity')}
                  body={t('parent.dashboard.noTimeline', 'No recent attendance records.')}
                  testID="dashboard-timeline-empty"
                />
              )
            : (
                <>
                  {recentTimeline
                    .slice(0, 3)
                    .map((record: TimelineRecord, idx: number, arr: TimelineRecord[]) => (
                      <TimelineRow
                        key={`${record.date}-${record.time}-${record.status}`}
                        record={record}
                        isLast={idx === arr.length - 1}
                        isRTL={isRTL}
                        locale={locale}
                        studentName={selectedStudent?.fullName}
                        studentId={effectiveSelectedId ?? undefined}
                        t={t}
                      />
                    ))}
                </>
              )}
        </View>

        {effectiveSelectedId
          ? (
              <View style={{ paddingHorizontal: 16, marginTop: 24, gap: 10 }}>
                <PressButton
                  variant="ghost"
                  size="md"
                  fullWidth
                  onPress={() => router.push(AppRoute.parent.studentPerformance(effectiveSelectedId))}
                  label={t('parent.dashboard.seePerformance', 'View performance & ratings')}
                  trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.ink} />}
                  testID="performance-button"
                />
              </View>
            )
          : null}
      </ScrollView>
    </View>
  );
}
