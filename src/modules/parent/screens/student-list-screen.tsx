import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressButton, SectionLabel } from '@/components/ui';
import colors from '@/components/ui/colors';
import { AppRoute } from '@/core/navigation/routes';
import { StudentCard } from '../components/students';
import { useStudents } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';

/**
 * StudentListScreen — card list of linked students per `screens-parent.jsx`
 * design (Monogram + name + grade · attendance %).
 */
export function StudentListScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = i18n?.language === 'ar';
  const { data: students, isLoading, error, refetch } = useStudents();
  const attendanceLabel = t('parent.studentList.attendanceLabel', 'attendance');

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

  if (!students || students.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12, backgroundColor: colors.neutral.paper }}>
        <Text style={{ color: colors.neutral.ink, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
          {t('parent.studentList.emptyTitle')}
        </Text>
        <Text style={{ color: colors.neutral.inkMuted, fontSize: 14, fontWeight: '500', textAlign: 'center' }}>
          {t('parent.studentList.emptyMessage')}
        </Text>
        <PressButton
          variant="gradient"
          size="md"
          onPress={() => router.push(AppRoute.parent.linkStudent)}
          label={t('parent.dashboard.linkStudentCta')}
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
            onPress={() => router.push(AppRoute.parent.studentDetails(item.id))}
          />
        )}
      />
    </View>
  );
}
