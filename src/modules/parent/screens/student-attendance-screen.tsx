import type { AttendanceRecord } from '../types/student.types';
import type { SupportedLocale } from '@/lib/date';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, SectionList, View } from 'react-native';
import { EmptyState, ErrorState, Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { dayjs } from '@/lib/date';
import {
  AttendanceHeader,
  AttendanceRecordRow,
  AttendanceSkeleton,
} from '../components/attendance';
import { useAttendance, useAttendanceStats, useStudentDetails } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';

/**
 * Parent · Attendance — month-grouped attendance list on the paper canvas.
 * State coverage per the Parent States Pass: AttendanceSkeleton while loading,
 * ErrorState (retry) on failure, EmptyState when there are no records.
 * Rows/header/skeleton live in `../components/attendance/` to keep this file
 * a scannable screen wrapper.
 */
export function StudentAttendanceScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const studentId = typeof id === 'string' ? id : '';
  const isRTL = I18nManager.isRTL;
  const locale: SupportedLocale = i18n?.language === 'ar' ? 'ar' : 'en';

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

  const groupedRecords = useMemo(() => buildSections(records, t, locale), [records, t, locale]);

  if (!studentId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.neutral.paper }}>
        <ErrorState
          title={t('parent.attendance.errorTitle', 'Could not load attendance')}
          body={t('parent.common.genericError')}
        />
      </View>
    );
  }

  if (isLoading && !records)
    return <AttendanceSkeleton testID="loading-indicator" />;

  if (error && !records) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.neutral.paper }}>
        <ErrorState
          title={t('parent.attendance.errorTitle', 'Could not load attendance')}
          body={extractErrorMessage(error, t)}
          action={{ label: t('parent.common.retry', 'Retry'), onPress: handleRefetch }}
          testID="retry-button"
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      <SectionList
        sections={groupedRecords}
        keyExtractor={(item, index) => `${item.sessionDate}-${index}`}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshing={isLoading}
        onRefresh={handleRefetch}
        ListHeaderComponent={<AttendanceHeader student={student} stats={stats} isRTL={isRTL} t={t} />}
        ListEmptyComponent={(
          <EmptyState
            scope="parentNoAttendance"
            title={t('parent.attendance.emptyTitle', 'No Records Yet')}
            body={t('parent.attendance.emptyMessage', 'No attendance records available.')}
            testID="attendance-empty"
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text
            style={{
              marginTop: 8,
              marginBottom: 12,
              fontSize: 13,
              fontWeight: '700',
              letterSpacing: 0.3,
              color: colors.neutral.ink,
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {title}
          </Text>
        )}
        renderItem={({ item }) => <AttendanceRecordRow item={item} isRTL={isRTL} t={t} />}
      />
    </View>
  );
}

function buildSections(
  records: AttendanceRecord[] | undefined,
  t: ReturnType<typeof useTranslation>['t'],
  locale: SupportedLocale,
): { title: string; data: AttendanceRecord[] }[] {
  if (!records)
    return [];

  const groups = new Map<string, AttendanceRecord[]>();
  records.forEach((r) => {
    let monthYear: string;
    try {
      monthYear = dayjs(r.sessionDate).locale(locale).format('MMMM YYYY');
    }
    catch {
      monthYear = t('parent.attendance.unknownDate', 'Unknown Date');
    }
    if (!groups.has(monthYear))
      groups.set(monthYear, []);
    groups.get(monthYear)!.push(r);
  });

  return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
}
