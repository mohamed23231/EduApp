import type { SupportedLocale } from '@/lib/date';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, ErrorState, SectionLabel, Skeleton } from '@/components/ui';
import colors from '@/components/ui/colors';
import { AppRoute } from '@/core/navigation/routes';
import { ScheduleRow } from '../components/schedule';
import { useStudents } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';

/**
 * Parent Schedule tab — aggregates the next session per linked student.
 * Per `screens-parent.jsx` design + Parent States Pass (keep-and-finish):
 * loading → Skeleton rows, error → ErrorState (retry), empty → EmptyState
 * with a "link a student" CTA. No new-data calendar.
 */
export function ScheduleScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = i18n?.language === 'ar';
  const locale: SupportedLocale = isRTL ? 'ar' : 'en';
  const { data: students, isLoading, error, refetch } = useStudents();

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 }}>
          <Text
            style={{
              color: colors.neutral.inkMuted,
              fontSize: 12,
              fontWeight: '600',
              letterSpacing: 0.2,
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {t('parent.schedule.upcomingLabel', 'UPCOMING')}
          </Text>
          <Text
            style={{
              color: colors.neutral.ink,
              fontSize: 22,
              fontWeight: '700',
              letterSpacing: -0.5,
              marginTop: 2,
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {t('parent.schedule.title', 'Schedule')}
          </Text>
        </View>

        {isLoading
          ? <ScheduleSkeleton />
          : error
            ? (
                <ErrorState
                  title={t('parent.schedule.errorTitle', 'Could not load the schedule')}
                  body={extractErrorMessage(error, t)}
                  action={{ label: t('parent.common.retry', 'Retry'), onPress: () => refetch() }}
                  testID="schedule-error"
                />
              )
            : !students || students.length === 0
                ? (
                    <View style={{ paddingTop: 24 }}>
                      <EmptyState
                        scope="parentNoChildren"
                        title={t('parent.schedule.emptyTitle', 'Nothing scheduled')}
                        body={t('parent.schedule.emptyMessage', 'Upcoming sessions will appear here once a child is linked.')}
                        action={{
                          label: t('parent.dashboard.linkStudentCta', 'Link a Student'),
                          onPress: () => router.push(AppRoute.parent.linkStudent),
                        }}
                        testID="schedule-empty"
                      />
                    </View>
                  )
                : (
                    <>
                      <View style={{ paddingHorizontal: 16 }}>
                        <SectionLabel>{t('parent.schedule.upcomingLabel', 'UPCOMING')}</SectionLabel>
                      </View>
                      <View style={{ marginTop: 8 }}>
                        {students.map(student => (
                          <ScheduleRow
                            key={student.id}
                            student={student}
                            locale={locale}
                            isRTL={isRTL}
                            t={t}
                          />
                        ))}
                      </View>
                    </>
                  )}
      </ScrollView>
    </View>
  );
}

function ScheduleSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 8, gap: 12 }} testID="schedule-skeleton">
      {[0, 1, 2].map(i => (
        <View
          key={i}
          style={{
            backgroundColor: colors.neutral.card,
            borderColor: colors.neutral.rule,
            borderWidth: 1,
            borderRadius: colors.radii.r3,
            padding: 16,
            gap: 10,
          }}
        >
          <Skeleton width="55%" height={16} />
          <Skeleton width="80%" height={12} />
        </View>
      ))}
    </View>
  );
}
