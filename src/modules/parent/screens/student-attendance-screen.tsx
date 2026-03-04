import type { AttendanceRecord } from '../types/student.types';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, SectionList, View, I18nManager } from 'react-native';
import { useMemo } from 'react';
import { Button, Text } from '@/components/ui';
import { useAttendance, useAttendanceStats, useStudentDetails } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';
import { Ionicons } from '@expo/vector-icons';

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

  const getStatusConfig = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'PRESENT': return { bg: 'bg-green-100', text: 'text-green-700', label: t('parent.attendance.statusPresent', 'Present'), dot: 'bg-green-500', hex: '#22C55E' };
      case 'ABSENT': return { bg: 'bg-red-100', text: 'text-red-700', label: t('parent.attendance.statusAbsent', 'Absent'), dot: 'bg-red-500', hex: '#EF4444' };
      case 'EXCUSED': return { bg: 'bg-orange-100', text: 'text-orange-700', label: t('parent.attendance.statusExcused', 'Excused'), dot: 'bg-orange-500', hex: '#F59E0B' };
      case 'NOT_MARKED':
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: t('parent.attendance.statusNotMarked', 'Not Marked'), dot: 'bg-gray-500', hex: '#9CA3AF' };
    }
  };

  const groupedRecords = useMemo(() => {
    if (!records) return [];
    
    const groups = new Map<string, AttendanceRecord[]>();
    records.forEach(r => {
      let monthYear = '';
      try {
        const date = new Date(r.sessionDate);
        monthYear = date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      } catch (e) {
        monthYear = t('parent.attendance.unknownDate', 'Unknown Date');
      }
      
      if (!groups.has(monthYear)) groups.set(monthYear, []);
      groups.get(monthYear)!.push(r);
    });

    return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
  }, [records, t]);

  if (!studentId) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-center text-base font-semibold text-red-600">
          {t('parent.common.genericError')}
        </Text>
      </View>
    );
  }

  if (isLoading && !records) {
    return (
      <View className="flex-1 px-4 py-6 bg-[#F9FAFB]" testID="loading-indicator">
        <View className="h-32 bg-white rounded-2xl mb-6 shadow-sm border border-gray-100 px-6 justify-center">
          <View className="h-6 w-1/2 bg-gray-200 rounded mb-4" />
          <View className="flex-row items-center space-x-4">
            <View className="h-8 w-1/3 bg-gray-200 rounded" />
            <View className="h-8 w-1/3 bg-gray-200 rounded ml-4" />
          </View>
        </View>
        {[1, 2, 3].map(i => (
          <View key={i} className="mb-4 bg-white p-4 rounded-2xl border border-gray-100">
            <View className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
            <View className="h-4 w-1/2 bg-gray-200 rounded" />
          </View>
        ))}
      </View>
    );
  }

  if (error && !records) {
    const errorMessage = extractErrorMessage(error as Error, t);
    return (
      <View className="flex-1 items-center justify-center px-6 bg-[#F9FAFB]">
        <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
          <Ionicons name="alert" size={32} color="#EF4444" />
        </View>
        <Text className="text-lg font-bold text-gray-900 mb-2 text-center">
          {t('parent.common.errorTitle', 'Oops!')}
        </Text>
        <Text className="mb-6 text-center text-sm font-medium text-gray-500">
          {errorMessage}
        </Text>
        <Button
          label={t('parent.common.retry')}
          onPress={handleRefetch}
        />
      </View>
    );
  }

  const renderHeader = () => {
    if (!student && !stats) return null;
    
    return (
      <View className="mb-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <Text className="text-xl font-bold text-gray-900 mb-4" style={{ textAlign: isRTL ? 'right' : 'left' }}>
          {student?.fullName || t('parent.attendance.studentName', 'Student')}
        </Text>
        
        {stats && (
          <View className={`items-center justify-start ${isRTL ? 'flex-row-reverse' : 'flex-row'} flex-wrap -mx-2`}>
            <View className="px-2 mb-2">
              <View className="bg-indigo-50 rounded-lg px-4 py-3 border border-indigo-100 items-center">
                <Text className="text-2xl font-bold text-indigo-600">
                  {Math.round(stats.attendanceRate)}%
                </Text>
                <Text className="text-xs font-medium text-indigo-800 uppercase tracking-wide mt-1">
                  {t('parent.attendance.rate', 'Present')}
                </Text>
              </View>
            </View>
            
            <View className="px-2 mb-2">
              <View className="bg-red-50 rounded-lg px-4 py-3 border border-red-100 items-center">
                <Text className="text-2xl font-bold text-red-600">
                  {stats.absent}
                </Text>
                <Text className="text-xs font-medium text-red-800 uppercase tracking-wide mt-1">
                  {t('parent.attendance.absentCount', 'Absent')}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-6">
        <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
      </View>
      <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
        {t('parent.attendance.emptyTitle', 'No Records Yet')}
      </Text>
      <Text className="text-center text-base text-gray-500">
        {t('parent.attendance.emptyMessage', 'There are no attendance records for this student.')}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <SectionList
        sections={groupedRecords}
        keyExtractor={(item, index) => `${item.sessionDate}-${index}`}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshing={isLoading}
        onRefresh={handleRefetch}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-sm font-bold text-gray-900 mt-2 mb-3 tracking-wide" style={{ textAlign: isRTL ? 'right' : 'left' }}>
            {title}
          </Text>
        )}
        renderItem={({ item }) => {
          const config = getStatusConfig(item.status);
          const teacherName = item.teacherName;
          
          return (
            <View
              className="mb-3 bg-white rounded-2xl p-4 shadow-sm"
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderTopColor: '#F3F4F6',
                borderBottomColor: '#F3F4F6',
                borderLeftWidth: isRTL ? 1 : 4,
                borderRightWidth: isRTL ? 4 : 1,
                borderLeftColor: isRTL ? '#F3F4F6' : config.hex,
                borderRightColor: isRTL ? config.hex : '#F3F4F6',
              }}
            >
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 mb-1" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {item.sessionName}
                </Text>
                
                <View className={`${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center mb-2`}>
                  <Ionicons name="time-outline" size={14} color="#6B7280" />
                  <Text className={`text-xs text-gray-500 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                    {item.sessionDate}
                  </Text>
                  
                  {teacherName && (
                    <>
                      <Text className="mx-2 text-gray-300">•</Text>
                      <Ionicons name="person-outline" size={14} color="#6B7280" />
                      <Text className={`text-xs text-gray-500 ${isRTL ? 'mr-1' : 'ml-1'}`}>
                        {teacherName}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              
              <View className={`${isRTL ? 'mr-3' : 'ml-3'} justify-start`}>
                <View className={`${config.bg} px-2.5 py-1 rounded-full flex-row items-center`}>
                  <View className={`w-1.5 h-1.5 rounded-full ${config.dot} ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                  <Text className={`text-xs font-bold ${config.text}`}>
                    {config.label}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
