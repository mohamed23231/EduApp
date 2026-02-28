import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { useFeatureFlags } from '@/core/feature-flags/use-feature-flags';
import { AppRoute } from '@/core/navigation/routes';
import { useStudentDetails } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';

/**
 * StudentDetailsScreen component
 * Displays detailed information about a linked student
 * Implements four-state pattern: loading, empty, success, error
 * Provides navigation to student attendance records
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */
export function StudentDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Hooks must always be called in the same order - no conditional returns before hooks
  const { data: student, isLoading, error, refetch } = useStudentDetails(id || '');
  const { isParentPerformanceEnabled } = useFeatureFlags();

  if (!id) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-center text-base font-semibold text-red-600">
          {t('parent.common.genericError')}
        </Text>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" testID="loading-indicator">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Error state
  if (error) {
    const errorMessage = extractErrorMessage(error, t);
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Text className="mb-4 text-center text-base font-semibold text-red-600">
          {errorMessage}
        </Text>
        <Button
          label={t('parent.common.retry')}
          onPress={() => refetch()}
        />
      </View>
    );
  }

  // Empty state (no student data)
  if (!student) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-center text-base font-semibold">
          {t('parent.common.genericError')}
        </Text>
      </View>
    );
  }

  // Success state - render student details
  return (
    <View className="flex-1 px-4 py-6">
      {/* Student Name */}
      <Text className="mb-6 text-2xl font-bold">{student.fullName}</Text>

      {/* Student Profile Information */}
      <View className="mb-6">
        {student.gradeLevel && (
          <View className="mb-4">
            <Text className="mb-1 text-sm text-gray-600">{t('parent.studentDetails.labels.grade')}</Text>
            <Text className="text-base font-semibold">{student.gradeLevel}</Text>
          </View>
        )}

        {student.email && (
          <View className="mb-4">
            <Text className="mb-1 text-sm text-gray-600">{t('parent.studentDetails.labels.email')}</Text>
            <Text className="text-base font-semibold">{student.email}</Text>
          </View>
        )}

        {student.phone && (
          <View className="mb-4">
            <Text className="mb-1 text-sm text-gray-600">{t('parent.studentDetails.labels.phone')}</Text>
            <Text className="text-base font-semibold">{student.phone}</Text>
          </View>
        )}

        {student.enrollmentDate && (
          <View className="mb-4">
            <Text className="mb-1 text-sm text-gray-600">{t('parent.studentDetails.labels.enrollmentDate')}</Text>
            <Text className="text-base font-semibold">{student.enrollmentDate}</Text>
          </View>
        )}
      </View>

      {/* Navigation to Attendance */}
      <Button
        label={t('parent.studentDetails.viewAttendance')}
        onPress={() => router.push(AppRoute.parent.studentAttendance(id))}
      />

      {/* Navigation to Performance */}
      {isParentPerformanceEnabled && (
        <View style={{ marginTop: 12 }}>
          <Button
            label={t('parent.performance.title')}
            onPress={() => router.push(AppRoute.parent.studentPerformance(id) as any)}
            variant="outline"
          />
        </View>
      )}
    </View>
  );
}
