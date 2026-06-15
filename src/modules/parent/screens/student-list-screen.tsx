import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, ErrorState, SectionLabel } from '@/components/ui';
import colors from '@/components/ui/colors';
import { SkeletonCard } from '@/components/ui/skeleton';
import { AppRoute } from '@/core/navigation/routes';
import { StudentCard } from '../components/students';
import { useStudents } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';

/**
 * StudentListScreen — card list of linked students per `screens-parent.jsx`
 * design (Monogram + name + grade · attendance %). State coverage per the
 * Parent States Pass: SkeletonCard rows while loading, ErrorState (retry) on
 * failure, EmptyState with a link-a-child CTA when none are linked.
 */
export function StudentListScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = i18n?.language === 'ar';
  const { data: students, isLoading, error, refetch } = useStudents();
  const attendanceLabel = t('parent.studentList.attendanceLabel', 'attendance');
  const unlinkedLabel = t('parent.studentList.unlinkedBadge', 'Unlinked');

  if (isLoading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.neutral.paper, paddingTop: insets.top + 16 }}
        testID="loading-indicator"
      >
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.neutral.paper }}>
        <ErrorState
          title={t('parent.studentList.errorTitle', 'Could not load your students')}
          body={extractErrorMessage(error, t)}
          action={{ label: t('parent.common.retry', 'Retry'), onPress: () => refetch() }}
          testID="retry-button"
        />
      </View>
    );
  }

  if (!students || students.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.neutral.paper }}>
        <EmptyState
          scope="parentNoChildren"
          title={t('parent.studentList.emptyTitle', 'No Students')}
          body={t('parent.studentList.emptyMessage', 'Link a student to see them here.')}
          action={{
            label: t('parent.dashboard.linkStudentCta', 'Link a Student'),
            onPress: () => router.push(AppRoute.parent.linkStudent),
          }}
          testID="student-list-empty"
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      <FlatList
        data={students}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }}
        ListHeaderComponent={(
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text
              style={{
                color: colors.neutral.ink,
                fontSize: 22,
                fontWeight: '700',
                letterSpacing: -0.5,
                marginBottom: 8,
                textAlign: isRTL ? 'right' : 'left',
              }}
            >
              {t('parent.studentList.title')}
            </Text>
            <SectionLabel>{t('parent.studentList.title')}</SectionLabel>
          </View>
        )}
        renderItem={({ item }) => (
          <StudentCard
            student={item}
            isRTL={isRTL}
            attendanceLabel={attendanceLabel}
            unlinkedLabel={unlinkedLabel}
            onPress={() => router.push(AppRoute.parent.studentDetails(item.id))}
          />
        )}
      />
    </View>
  );
}
