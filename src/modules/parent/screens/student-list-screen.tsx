import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import { useStudents } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';

/**
 * StudentListScreen component
 * Displays all students linked to the authenticated parent
 * Implements four-state pattern: loading, empty, success, error
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */
export function StudentListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: students, isLoading, error, refetch } = useStudents();

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

  // Empty state
  if (!students || students.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Text className="mb-2 text-lg font-semibold">
          {t('parent.studentList.emptyTitle')}
        </Text>
        <Text className="mb-6 text-center text-sm text-gray-600">
          {t('parent.studentList.emptyMessage')}
        </Text>
        <Button
          label={t('parent.dashboard.linkStudentCta')}
          onPress={() => router.push('/(parent)/students/link')}
        />
      </View>
    );
  }

  // Success state - render FlatList of students
  return (
    <View className="flex-1">
      <FlatList
        data={students}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable
            className="border-b border-gray-200 px-4 py-3"
            onPress={() => router.push(AppRoute.parent.studentDetails(item.id))}
            accessibilityRole="button"
          >
            <Text className="text-base font-semibold">{item.fullName}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
