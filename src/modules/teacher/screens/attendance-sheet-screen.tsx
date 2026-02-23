/**
 * AttendanceSheetScreen component
 * Mark attendance for a session instance
 */

import type { AttendanceStatus } from '../types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from '@/components/ui';
import { AttendanceStatusControl } from '../components';
import { useAttendance } from '../hooks';
import { extractErrorMessage } from '../services';

export function AttendanceSheetScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { instanceId } = useLocalSearchParams();

  const {
    session,
    students,
    attendanceMap,
    isLoading,
    error,
    isSubmitting,
    setStudentStatus,
    setExcuseNote,
    submitAttendance,
  } = useAttendance(instanceId as string);

  const handleSubmit = async () => {
    if (!session) {
      Alert.alert(
        t('teacher.attendance.error'),
        t('teacher.common.genericError'),
        [{ text: t('teacher.common.retry'), style: 'default' }],
      );
      return;
    }

    if (session.state !== 'ACTIVE') {
      Alert.alert(
        t('teacher.attendance.error'),
        t('teacher.attendance.sessionNotActive'),
        [{ text: t('teacher.common.ok'), style: 'default' }],
      );
      return;
    }

    try {
      await submitAttendance();
      Alert.alert(
        t('teacher.attendance.title'),
        t('teacher.attendance.submitButton'),
        [{ text: t('teacher.common.ok'), style: 'default', onPress: () => router.back() }],
      );
    }
    catch (err) {
      const message = extractErrorMessage(err, t, 'teacher.common.genericError');
      Alert.alert(t('teacher.attendance.error'), message);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error && students.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            label={t('teacher.common.retry')}
            onPress={() => router.back()}
            style={{ marginTop: 12 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleStatusChange = (studentId: string) => (status: AttendanceStatus) => {
    setStudentStatus(studentId, status);
  };

  const handleExcuseNoteChange = (studentId: string) => (note: string) => {
    setExcuseNote(studentId, note);
  };

  const sessionClosed = session?.state === 'CLOSED';
  const sessionNotActive = session?.state !== 'ACTIVE';

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{t('teacher.common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('teacher.attendance.title')}</Text>
      </View>

      {sessionClosed && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>{t('teacher.attendance.sessionClosed')}</Text>
        </View>
      )}

      {sessionNotActive && !sessionClosed && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>{t('teacher.attendance.sessionNotActive')}</Text>
        </View>
      )}

      {students.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('teacher.attendance.emptyMessage')}</Text>
        </View>
      ) : (
        <>
          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentInner}>
            {students.map((student) => {
              const attendance = attendanceMap[student.id];
              return (
                <AttendanceStatusControl
                  key={student.id}
                  student={student}
                  status={attendance?.status || null}
                  excuseNote={attendance?.excuseNote || ''}
                  onStatusChange={handleStatusChange(student.id)}
                  onExcuseNoteChange={handleExcuseNoteChange(student.id)}
                  disabled={sessionNotActive || isSubmitting}
                />
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label={isSubmitting ? t('teacher.attendance.submitting') : t('teacher.attendance.submitButton')}
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={sessionNotActive || isSubmitting}
              variant="default"
            />
            {error && (
              <Text style={styles.errorBanner}>{error}</Text>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    fontSize: 16,
    color: '#3B82F6',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  warningBanner: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
  },
  warningText: {
    fontSize: 13,
    color: '#78350F',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
  },
  errorBanner: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
  },
});
