import type { AttendanceRecord } from '../types/student.types';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { useAttendance } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';

export function StudentAttendanceScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const studentId = typeof id === 'string' ? id : '';
  const { data: records, isLoading, error, refetch } = useAttendance(studentId);

  if (!studentId) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-center text-base font-semibold text-red-600">
          {t('parent.common.genericError')}
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" testID="loading-indicator">
        <ActivityIndicator size="large" />
      </View>
    );
  }

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

  if (!records || records.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-center text-sm text-gray-600">
          {t('parent.attendance.emptyMessage')}
        </Text>
      </View>
    );
  }

  const getStatusLabel = (status: AttendanceRecord['status']): string => {
    const statusMap: Record<AttendanceRecord['status'], string> = {
      PRESENT: t('parent.attendance.statusPresent'),
      ABSENT: t('parent.attendance.statusAbsent'),
      EXCUSED: t('parent.attendance.statusExcused'),
      NOT_MARKED: t('parent.attendance.statusNotMarked'),
    };
    return statusMap[status] || status;
  };

  return (
    <View className="flex-1">
      <FlatList
        data={records}
        keyExtractor={(item, index) => `${item.sessionDate}-${index}`}
        renderItem={({ item }) => (
          <View className="border-b border-gray-200 px-4 py-3">
            <Text className="text-base font-semibold">{item.sessionName}</Text>
            <Text className="mt-1 text-sm text-gray-600">{item.sessionDate}</Text>
            <Text className="mt-2 text-sm font-medium text-blue-600">
              {getStatusLabel(item.status)}
            </Text>
          </View>
        )}
        ListEmptyComponent={(
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-center text-sm text-gray-600">
              {t('parent.attendance.emptyMessage')}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
