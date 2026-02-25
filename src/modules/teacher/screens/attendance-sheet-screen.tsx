/**
 * AttendanceSheetScreen component
 * Mark attendance for a session instance
 */

import type { AttendanceStatus } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ConfirmModal, Text, useModal } from '@/components/ui';
import { AttendanceStatusControl } from '../components';
import { BatchRatingSheet } from '../components/batch-rating-sheet';
import { useAttendance } from '../hooks';
import { extractErrorMessage } from '../services';

export function AttendanceSheetScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ 'instance-id': string }>();
  const instanceId = params['instance-id'];
  const [searchQuery, setSearchQuery] = useState('');

  const batchRatingModal = useModal();

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    variant: 'default' | 'destructive' | 'success';
    hideCancelButton: boolean;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    variant: 'default',
    hideCancelButton: false,
    onConfirm: () => { },
  });

  const dismissConfirm = () => setConfirmModal(prev => ({ ...prev, visible: false }));

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

  // Filter students by search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim())
      return students;
    const query = searchQuery.toLowerCase().trim();
    return students.filter(s => s.name.toLowerCase().includes(query));
  }, [students, searchQuery]);

  const handleSubmit = async () => {
    if (!session) {
      setConfirmModal({
        visible: true,
        title: t('teacher.attendance.error'),
        message: t('teacher.common.genericError'),
        variant: 'destructive',
        hideCancelButton: true,
        onConfirm: dismissConfirm,
      });
      return;
    }

    if (session.state !== 'ACTIVE') {
      setConfirmModal({
        visible: true,
        title: t('teacher.attendance.error'),
        message: t('teacher.attendance.sessionNotActive'),
        variant: 'destructive',
        hideCancelButton: true,
        onConfirm: dismissConfirm,
      });
      return;
    }

    try {
      await submitAttendance();
      setConfirmModal({
        visible: true,
        title: t('teacher.attendance.submitSuccess'),
        message: '',
        variant: 'success',
        hideCancelButton: true,
        onConfirm: () => {
          dismissConfirm();
          router.back();
        },
      });
    }
    catch (err) {
      const message = extractErrorMessage(err, t, 'teacher.common.genericError');
      setConfirmModal({
        visible: true,
        title: t('teacher.attendance.error'),
        message,
        variant: 'destructive',
        hideCancelButton: true,
        onConfirm: dismissConfirm,
      });
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

  const handleRatingChange = (studentId: string) => (rating: number | null) => {
    setStudentRating(studentId, rating);
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

      {students.length === 0
        ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('teacher.attendance.emptyMessage')}</Text>
          </View>
        )
        : (
          <>
            {unratedCount > 0 && !sessionNotActive && (
              <Pressable
                style={styles.batchRatingButton}
                onPress={batchRatingModal.present}
              >
                <Ionicons name="flash" size={18} color="#F59E0B" />
                <Text style={styles.batchRatingText}>
                  {t('teacher.attendance.batchRatingButton', { count: unratedCount })}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </Pressable>
            )}

            {students.length > 2 && (
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('teacher.attendance.searchStudent')}
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </Pressable>
                )}
              </View>
            )}

            <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentInner}>
              {filteredStudents.length === 0
                ? (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>{t('teacher.attendance.noSearchResults')}</Text>
                  </View>
                )
                : (
                  filteredStudents.map((student) => {
                    const attendance = attendanceMap[student.id];
                    return (
                      <AttendanceStatusControl
                        key={student.id}
                        student={student}
                        status={attendance?.status || null}
                        excuseNote={attendance?.excuseNote || ''}
                        rating={attendance?.rating ?? null}
                        onStatusChange={handleStatusChange(student.id)}
                        onExcuseNoteChange={handleExcuseNoteChange(student.id)}
                        onRatingChange={handleRatingChange(student.id)}
                        disabled={sessionNotActive || isSubmitting}
                      />
                    );
                  })
                )}
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
  batchRatingButton: {
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  batchRatingText: {
    color: '#92400E',
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    color: '#111827',
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    color: '#9CA3AF',
    fontSize: 15,
  },
});
