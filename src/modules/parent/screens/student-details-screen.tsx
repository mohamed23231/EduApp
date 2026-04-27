import type { TimelineRecord } from '../types';
import type { SupportedLocale } from '@/lib/date';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Icon, PressButton, SectionLabel } from '@/components/ui';
import colors from '@/components/ui/colors';
import { useFeatureFlags } from '@/core/feature-flags/use-feature-flags';
import { AppRoute } from '@/core/navigation/routes';
import { TimelineRow } from '../components/dashboard';
import { StudentHero } from '../components/student';
import { useAttendanceStats, useAttendanceTimeline, useStudentDetails } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';

/**
 * Parent · Student Detail — dark hero (Monogram + 3-stat strip),
 * RECENT timeline (3 reused activity cards), and CTAs to attendance + performance.
 * Mirrors `screens-parent.jsx` § PARENT · STUDENT DETAIL, scoped to data the BE
 * already exposes today (attendance stats + timeline + student details).
 */

// eslint-disable-next-line max-lines-per-function
export function StudentDetailsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isRTL = i18n?.language === 'ar';
  const locale: SupportedLocale = isRTL ? 'ar' : 'en';

  const { data: student, isLoading, error, refetch } = useStudentDetails(id || '');
  const { data: stats } = useAttendanceStats(id || '');
  const { data: timeline } = useAttendanceTimeline(id || '', 1, 5);
  const { isParentPerformanceEnabled } = useFeatureFlags();

  if (!id || (!isLoading && !student && !error))
    return <CenterText label={t('parent.common.genericError')} />;

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.neutral.paper }}
        testID="loading-indicator"
      >
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16, backgroundColor: colors.neutral.paper }}>
        <Text style={{ color: colors.semantic.absent, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>
          {extractErrorMessage(error, t)}
        </Text>
        <PressButton
          variant="gradient"
          size="md"
          onPress={() => refetch()}
          label={t('parent.common.retry')}
          testID="retry-button"
        />
      </View>
    );
  }

  if (!student)
    return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <StudentHero
          student={student}
          stats={stats}
          onBack={() => router.back()}
          isRTL={isRTL}
          t={t}
        />

        {timeline && timeline.length > 0
          ? (
              <>
                <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                  <SectionLabel>{t('parent.studentDetails.recentLabel', 'RECENT')}</SectionLabel>
                </View>
                <View style={{ marginHorizontal: 16, marginTop: 8, gap: 8 }}>
                  {timeline.slice(0, 3).map((record: TimelineRecord, idx: number, arr: TimelineRecord[]) => (
                    <TimelineRow
                      key={`${record.date}-${record.time}-${record.status}`}
                      record={record}
                      isLast={idx === arr.length - 1}
                      isRTL={isRTL}
                      locale={locale}
                      studentName={student.fullName}
                      studentId={student.id}
                      t={t}
                    />
                  ))}
                </View>
              </>
            )
          : null}

        <View style={{ paddingHorizontal: 16, marginTop: 24, gap: 10 }}>
          <PressButton
            variant="gradient"
            size="md"
            fullWidth
            onPress={() => router.push(AppRoute.parent.studentAttendance(id))}
            label={t('parent.studentDetails.viewAttendance')}
            trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.white} />}
            testID="view-attendance-button"
          />
          {isParentPerformanceEnabled
            ? (
                <PressButton
                  variant="ghost"
                  size="md"
                  fullWidth
                  onPress={() => router.push(AppRoute.parent.studentPerformance(id))}
                  label={t('parent.studentDetails.viewPerformance', 'View performance')}
                  trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.ink} />}
                />
              )
            : null}
        </View>
      </ScrollView>
    </View>
  );
}

function CenterText({ label }: { label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: colors.neutral.paper }}>
      <Text style={{ color: colors.semantic.absent, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>
        {label}
      </Text>
    </View>
  );
}
