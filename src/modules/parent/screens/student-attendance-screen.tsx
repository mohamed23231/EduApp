import type { AttendanceRecord, AttendanceStats, StudentDetails } from '../types/student.types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, SectionList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from '@/components/ui';
import { useAttendance, useAttendanceStats, useStudentDetails } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';

type StatusConfig = {
  bg: string;
  text: string;
  label: string;
  dot: string;
  hex: string;
};

function getStatusConfig(
  status: AttendanceRecord['status'],
  t: ReturnType<typeof useTranslation>['t'],
): StatusConfig {
  switch (status) {
    case 'PRESENT':
      return { bg: 'bg-green-100', text: 'text-green-700', label: t('parent.attendance.statusPresent', 'Present'), dot: 'bg-green-500', hex: '#22C55E' };
    case 'ABSENT':
      return { bg: 'bg-red-100', text: 'text-red-700', label: t('parent.attendance.statusAbsent', 'Absent'), dot: 'bg-red-500', hex: '#EF4444' };
    case 'EXCUSED':
      return { bg: 'bg-orange-100', text: 'text-orange-700', label: t('parent.attendance.statusExcused', 'Excused'), dot: 'bg-orange-500', hex: '#F59E0B' };
    case 'NOT_MARKED':
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', label: t('parent.attendance.statusNotMarked', 'Not Marked'), dot: 'bg-gray-500', hex: '#9CA3AF' };
  }
}

type AttendanceHeaderProps = {
  student: StudentDetails | undefined;
  stats: AttendanceStats | undefined;
  isRTL: boolean;
  t: ReturnType<typeof useTranslation>['t'];
};

function AttendanceHeader({ student, stats, isRTL, t }: AttendanceHeaderProps) {
  if (!student && !stats)
    return null;

  return (
    <View className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
      <Text
        className="mb-4 text-xl font-bold text-gray-900"
        style={{ textAlign: isRTL ? 'right' : 'left' }}
      >
        {student?.fullName || t('parent.attendance.studentName', 'Student')}
      </Text>

      {stats && (
        <View className={`${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
          <View className="flex-1 items-center rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <Text className="text-2xl font-bold text-blue-600">
              {Math.round(stats.attendanceRate)}
              %
            </Text>
            <Text className="mt-1 text-xs font-medium tracking-wide text-blue-800 uppercase">
              {t('parent.attendance.rate', 'Attendance Rate')}
            </Text>
          </View>

          <View className="flex-1 items-center rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <Text className="text-2xl font-bold text-red-600">
              {stats.absent}
            </Text>
            <Text className="mt-1 text-xs font-medium tracking-wide text-red-800 uppercase">
              {t('parent.attendance.absentCount', 'Absent')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

type AttendanceEmptyViewProps = {
  t: ReturnType<typeof useTranslation>['t'];
};

function AttendanceEmptyView({ t }: AttendanceEmptyViewProps) {
  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <View className="mb-6 size-20 items-center justify-center rounded-full bg-gray-100">
        <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
      </View>
      <Text className="mb-2 text-center text-xl font-bold text-gray-900">
        {t('parent.attendance.emptyTitle', 'No Records Yet')}
      </Text>
      <Text className="text-center text-base text-gray-500">
        {t('parent.attendance.emptyMessage', 'There are no attendance records for this student.')}
      </Text>
    </View>
  );
}

function AttendanceLoadingView() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-white">
    <View className="flex-1 px-4 py-6" testID="loading-indicator">
      <View className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <View className="mb-4 h-6 w-1/2 rounded-sm bg-gray-200" />
        <View className="flex-row gap-3">
          <View className="h-16 flex-1 rounded-xl bg-gray-200" />
          <View className="h-16 flex-1 rounded-xl bg-gray-200" />
        </View>
      </View>
      {[1, 2, 3].map(i => (
        <View key={i} className="mb-3 rounded-xl border border-gray-200 bg-white p-4">
          <View className="mb-2 h-5 w-3/4 rounded-sm bg-gray-200" />
          <View className="h-4 w-1/2 rounded-sm bg-gray-200" />
        </View>
      ))}
    </View>
    </SafeAreaView>
  );
}

type AttendanceErrorViewProps = {
  error: unknown;
  onRetry: () => void;
  t: ReturnType<typeof useTranslation>['t'];
};

function AttendanceErrorView({ error, onRetry, t }: AttendanceErrorViewProps) {
  const errorMessage = extractErrorMessage(error, t);
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-white">
    <View className="flex-1 items-center justify-center px-6">
      <View className="mb-4 size-16 items-center justify-center rounded-full bg-red-100">
        <Ionicons name="alert" size={32} color="#EF4444" />
      </View>
      <Text className="mb-2 text-center text-lg font-bold text-gray-900">
        {t('parent.common.errorTitle', 'Oops!')}
      </Text>
      <Text className="mb-6 text-center text-sm font-medium text-gray-500">
        {errorMessage}
      </Text>
      <Button label={t('parent.common.retry')} onPress={onRetry} />
    </View>
    </SafeAreaView>
  );
}

type AttendanceRecordItemProps = {
  item: AttendanceRecord;
  isRTL: boolean;
  t: ReturnType<typeof useTranslation>['t'];
};

function AttendanceRecordItem({ item, isRTL, t }: AttendanceRecordItemProps) {
  const config = getStatusConfig(item.status, t);
  const teacherName = item.teacherName;

  return (
    <View
      className="mb-3 rounded-xl border border-gray-200 bg-white p-4"
      style={{
        flexDirection: isRTL ? 'row-reverse' : 'row',
        borderStartWidth: 4,
        borderStartColor: config.hex,
      }}
    >
      <View className="flex-1">
        <Text
          className="mb-1 text-base font-semibold text-gray-900"
          style={{ textAlign: isRTL ? 'right' : 'left' }}
        >
          {item.sessionName}
        </Text>

        <View className={`${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center gap-1`}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text className="text-xs text-gray-500">
            {item.sessionDate}
          </Text>

          {teacherName && (
            <>
              <Text className="mx-1 text-gray-300">|</Text>
              <Ionicons name="person-outline" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-500">
                {teacherName}
              </Text>
            </>
          )}
        </View>
      </View>

      <View className="justify-start" style={{ marginStart: 12 }}>
        <View className={`${config.bg} flex-row items-center rounded-full px-2.5 py-1`}>
          <View
            className={`size-1.5 rounded-full ${config.dot}`}
            style={{ marginEnd: 6 }}
          />
          <Text className={`text-xs font-bold ${config.text}`}>
            {config.label}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function StudentAttendanceScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const studentId = typeof id === 'string' ? id : '';
  const isRTL = I18nManager.isRTL;

  const { data: records, isLoading: isRecordsLoading, error: recordsError, refetch: refetchRecords } = useAttendance(studentId);
  const { data: stats, isLoading: isStatsLoading, error: statsError, refetch: refetchStats } = useAttendanceStats(studentId);
  const { data: student, isLoading: isStudentLoading, error: studentError, refetch: refetchStudent } = useStudentDetails(studentId);

  const isLoading = isRecordsLoading || isStatsLoading || isStudentLoading;
  const error = recordsError || statsError || studentError;

  const handleRefetch = () => {
    refetchRecords();
    refetchStats();
    refetchStudent();
  };

  const groupedRecords = useMemo(() => {
    if (!records)
      return [];

    const groups = new Map<string, AttendanceRecord[]>();
    records.forEach((r) => {
      let monthYear = '';
      try {
        const date = new Date(r.sessionDate);
        monthYear = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      }
      catch {
        monthYear = t('parent.attendance.unknownDate', 'Unknown Date');
      }

      if (!groups.has(monthYear))
        groups.set(monthYear, []);
      groups.get(monthYear)!.push(r);
    });

    return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
  }, [records, t]);

  if (!studentId) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4">
        <Text className="text-center text-base font-semibold text-red-600">
          {t('parent.common.genericError')}
        </Text>
      </View>
    );
  }

  if (isLoading && !records) {
    return <AttendanceLoadingView />;
  }

  if (error && !records) {
    return <AttendanceErrorView error={error} onRetry={handleRefetch} t={t} />;
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-white">
      <SectionList
        sections={groupedRecords}
        keyExtractor={(item, index) => `${item.sessionDate}-${index}`}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshing={isLoading}
        onRefresh={handleRefetch}
        ListHeaderComponent={<AttendanceHeader student={student} stats={stats} isRTL={isRTL} t={t} />}
        ListEmptyComponent={<AttendanceEmptyView t={t} />}
        renderSectionHeader={({ section: { title } }) => (
          <Text
            className="mt-4 mb-3 text-sm font-bold tracking-wide text-gray-500 uppercase"
            style={{ textAlign: isRTL ? 'right' : 'left' }}
          >
            {title}
          </Text>
        )}
        renderItem={({ item }) => <AttendanceRecordItem item={item} isRTL={isRTL} t={t} />}
      />
    </SafeAreaView>
  );
}
