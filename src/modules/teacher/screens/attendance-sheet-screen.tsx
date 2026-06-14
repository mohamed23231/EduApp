/**
 * AttendanceSheetScreen component
 * Mark attendance for a session instance
 */

import type { AttendanceStatus } from '../types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ConfirmModal, Text, useModal } from '@/components/ui';
import { AttendanceSheetFooter } from '../components/attendance-sheet/attendance-sheet-footer';
import { AttendanceSheetHeader } from '../components/attendance-sheet/attendance-sheet-header';
import { AttendanceSheetToolbar } from '../components/attendance-sheet/attendance-sheet-toolbar';
import { AttendanceStudentList } from '../components/attendance-sheet/attendance-student-list';
import { BatchRatingSheet } from '../components/batch-rating-sheet';
import { useAttendance } from '../hooks';
import { useAttendanceSubmit } from '../hooks/use-attendance-submit';

// eslint-disable-next-line max-lines-per-function
export function AttendanceSheetScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ 'instance-id': string }>();
  const instanceId = params['instance-id'];
  const [searchQuery, setSearchQuery] = useState('');

  const batchRatingModal = useModal();

  const {
    session,
    students,
    attendanceMap,
    isLoading,
    error,
    isSubmitting,
    unratedCount,
    setStudentStatus,
    setExcuseNote,
    setStudentRating,
    applyBatchRating,
    submitAttendance,
  } = useAttendance(instanceId as string);

  const { confirmModal, dismissConfirm, handleSubmit } = useAttendanceSubmit({
    session,
    submitAttendance,
  });

  // Filter students by search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim())
      return students;
    const query = searchQuery.toLowerCase().trim();
    return students.filter(s => s.name.toLowerCase().includes(query));
  }, [students, searchQuery]);

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

  const handleRatingChange = (studentId: string) => (rating: number | null) => {
    setStudentRating(studentId, rating);
  };

  const sessionClosed = session?.state === 'CLOSED';
  const sessionNotActive = session?.state !== 'ACTIVE';

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <AttendanceSheetHeader
        sessionClosed={sessionClosed}
        sessionNotActive={sessionNotActive}
        onBack={() => router.back()}
      />

      {students.length === 0
        ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('teacher.attendance.emptyMessage')}</Text>
            </View>
          )
        : (
            <>
              <AttendanceSheetToolbar
                showBatchRating={unratedCount > 0 && !sessionNotActive}
                showSearch={students.length > 2}
                unratedCount={unratedCount}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onBatchRatingPress={batchRatingModal.present}
              />

              <AttendanceStudentList
                students={filteredStudents}
                attendanceMap={attendanceMap}
                disabled={sessionNotActive || isSubmitting}
                onStatusChange={handleStatusChange}
                onExcuseNoteChange={handleExcuseNoteChange}
                onRatingChange={handleRatingChange}
              />

              <AttendanceSheetFooter
                isSubmitting={isSubmitting}
                disabled={sessionNotActive || isSubmitting}
                error={error}
                onSubmit={handleSubmit}
              />
              <BatchRatingSheet
                ref={batchRatingModal.ref}
                unmarkedCount={unratedCount}
                onApply={applyBatchRating}
              />
            </>
          )}

      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        disableAnimations
        confirmLabel={t('teacher.common.ok')}
        cancelLabel={t('teacher.common.cancel')}
        hideCancelButton={confirmModal.hideCancelButton}
        onConfirm={confirmModal.onConfirm}
        onCancel={dismissConfirm}
      />
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
});
