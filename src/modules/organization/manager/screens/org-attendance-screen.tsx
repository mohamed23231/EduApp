/**
 * OrgAttendanceScreen
 * Attendance marking screen for the manager role.
 * StudentCard logic extracted to components/org-attendance/student-card.tsx.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, ConfirmModal, Text, TopBar } from '@/components/ui';
import colors from '@/components/ui/colors';
import { AttendanceHeader } from '../components/org-attendance/attendance-header';
import { StudentCard } from '../components/org-attendance/student-card';
import { useOrgAttendance } from '../hooks/use-org-attendance';
import { useOrgInstanceAttendance } from '../hooks/use-org-instance-attendance';
import { useManagerStore } from '../store/manager-store';

// ---------------------------------------------------------------------------
// OrgAttendanceScreen
// ---------------------------------------------------------------------------

// eslint-disable-next-line max-lines-per-function
export function OrgAttendanceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ 'instance-id': string }>();
  const instanceId = params['instance-id'];
  const activeOrgId = useManagerStore.use.activeOrgId();
  const [searchQuery, setSearchQuery] = useState('');

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
    onConfirm: () => {},
  });

  const dismissConfirm = () => setConfirmModal(prev => ({ ...prev, visible: false }));

  const {
    instance,
    students,
    attendanceMap,
    isLoading,
    error,
    isSubmitting,
    markedCount,
    totalCount,
    setStudentStatus,
    setExcuseNote,
    setStudentRating,
    submitAttendance,
  } = useOrgAttendance(activeOrgId ?? '', instanceId ?? '');

  const attendanceQuery = useOrgInstanceAttendance(activeOrgId ?? '', instanceId ?? '');

  const noteMap = useMemo(() => {
    const map: Record<string, { note: string; noteAuthorName: string }> = {};
    for (const record of attendanceQuery.data ?? []) {
      if (record.note) {
        map[record.studentId] = {
          note: record.note,
          noteAuthorName: record.noteAuthorName ?? 'Teacher',
        };
      }
    }
    return map;
  }, [attendanceQuery.data]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim())
      return students;
    const query = searchQuery.toLowerCase().trim();
    return students.filter(s => s.name.toLowerCase().includes(query));
  }, [students, searchQuery]);

  const handleSubmit = async () => {
    if (!instance) {
      setConfirmModal({
        visible: true,
        title: t('manager.common.errorTitle', { defaultValue: 'Something went wrong' }),
        message: t('manager.attendance.submitError', { defaultValue: 'Failed to save attendance. Please try again.' }),
        variant: 'destructive',
        hideCancelButton: true,
        onConfirm: dismissConfirm,
      });
      return;
    }

    if (instance.state !== 'ACTIVE') {
      setConfirmModal({
        visible: true,
        title: t('manager.common.errorTitle', { defaultValue: 'Something went wrong' }),
        message: t('manager.attendance.sessionNotActive', { defaultValue: 'Start the session first to mark attendance.' }),
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
        title: t('manager.attendance.submitSuccess', { defaultValue: 'Attendance saved successfully!' }),
        message: '',
        variant: 'success',
        hideCancelButton: true,
        onConfirm: () => {
          dismissConfirm();
          router.back();
        },
      });
    }
    catch {
      setConfirmModal({
        visible: true,
        title: t('manager.common.errorTitle', { defaultValue: 'Something went wrong' }),
        message: t('manager.attendance.submitError', { defaultValue: 'Failed to save attendance. Please try again.' }),
        variant: 'destructive',
        hideCancelButton: true,
        onConfirm: dismissConfirm,
      });
    }
  };

  const c = colors;
  const sessionClosed = instance?.state === 'CLOSED';
  const sessionDraft = instance?.state === 'DRAFT';
  const sessionNotActive = instance?.state !== 'ACTIVE';

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.neutral.paper }}>
        <TopBar
          title={t('manager.attendance.title', { defaultValue: 'Attendance' })}
          onBack={() => router.back()}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error (no students) ──────────────────────────────────────────────────
  if (error && students.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.neutral.paper }}>
        <TopBar
          title={t('manager.attendance.title', { defaultValue: 'Attendance' })}
          onBack={() => router.back()}
        />
        <View className="flex-1 items-center justify-center px-6">
          <Text style={{ fontSize: 16, color: c.semantic.absent, textAlign: 'center' }}>{error}</Text>
          <Button
            label={t('manager.attendance.back', { defaultValue: 'Back' })}
            onPress={() => router.back()}
            style={{ marginTop: 12 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.neutral.paper }}>
      {/* TopBar */}
      <TopBar
        title={instance?.subject ?? t('manager.attendance.title', { defaultValue: 'Attendance' })}
        onBack={() => router.back()}
      />

      {/* Subtitle below TopBar */}
      {instance && (
        <View className="px-4 pb-1">
          <Text style={{ fontSize: 13, color: c.neutral.inkMuted }}>
            {instance.time}
            {' · '}
            {instance.date}
          </Text>
        </View>
      )}

      {/* Warning banners */}
      {sessionClosed && (
        <View
          className="flex-row items-center gap-2 px-5 py-3"
          style={{ backgroundColor: c.semantic.excusedSoft, borderBottomWidth: 1, borderBottomColor: c.semantic.excused }}
        >
          <Text style={{ flex: 1, fontSize: 13, color: c.semantic.excusedInk }}>
            {t('manager.attendance.sessionClosed', { defaultValue: 'Session is closed — attendance is read-only.' })}
          </Text>
        </View>
      )}

      {sessionDraft && !sessionClosed && (
        <View
          className="flex-row items-center gap-2 px-5 py-3"
          style={{ backgroundColor: c.semantic.excusedSoft, borderBottomWidth: 1, borderBottomColor: c.semantic.excused }}
        >
          <Text style={{ flex: 1, fontSize: 13, color: c.semantic.excusedInk }}>
            {t('manager.attendance.sessionNotActive', { defaultValue: 'Start the session first to mark attendance.' })}
          </Text>
        </View>
      )}

      {students.length === 0
        ? (
            <View className="flex-1 items-center justify-center px-6">
              <Text style={{ fontSize: 16, color: c.neutral.inkMuted, textAlign: 'center' }}>
                {t('manager.attendance.emptyStudents', { defaultValue: 'No students assigned to this session.' })}
              </Text>
            </View>
          )
        : (
            <>
              {/* Search */}
              {students.length > 2 && (
                <View
                  className="mx-5 mt-3 flex-row items-center gap-2.5 rounded-xl px-3.5 py-2.5"
                  style={{ backgroundColor: c.neutral.card, borderWidth: 1, borderColor: c.neutral.rule }}
                >
                  <Text style={{ color: c.neutral.inkMuted }}>🔍</Text>
                  <TextInput
                    style={{ flex: 1, fontSize: 15, color: c.neutral.ink, padding: 0, textAlign: 'left' as const }}
                    placeholder={t('manager.attendance.searchStudent', { defaultValue: 'Search students...' })}
                    placeholderTextColor={c.neutral.inkMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')}>
                      <Text style={{ color: c.neutral.inkMuted }}>✕</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Student list */}
              <View className="flex-1">
                {filteredStudents.length === 0
                  ? (
                      <View className="flex-1 items-center justify-center py-10">
                        <Text style={{ fontSize: 15, color: c.neutral.inkMuted }}>
                          {t('manager.attendance.noSearchResults', { defaultValue: 'No students match your search.' })}
                        </Text>
                      </View>
                    )
                  : (
                      <View className="flex-1">
                        <AttendanceHeader
                          marked={markedCount}
                          total={totalCount}
                          present={filteredStudents.reduce((n, s) => n + (attendanceMap[s.id]?.status === 'PRESENT' ? 1 : 0), 0)}
                          absent={filteredStudents.reduce((n, s) => n + (attendanceMap[s.id]?.status === 'ABSENT' ? 1 : 0), 0)}
                          excused={filteredStudents.reduce((n, s) => n + (attendanceMap[s.id]?.status === 'EXCUSED' ? 1 : 0), 0)}
                          unmarked={totalCount - markedCount}
                          live={instance?.state === 'ACTIVE' ? 1 : 0}
                        />
                        <View style={{ flex: 1 }}>
                          <View className="gap-3 px-5 py-4">
                            {filteredStudents.map((student) => {
                              const attendance = attendanceMap[student.id];
                              return (
                                <StudentCard
                                  key={student.id}
                                  student={student}
                                  status={attendance?.status ?? null}
                                  excuseNote={attendance?.excuseNote ?? ''}
                                  rating={attendance?.rating ?? null}
                                  disabled={sessionNotActive || isSubmitting}
                                  note={noteMap[student.id]?.note}
                                  noteAuthorName={noteMap[student.id]?.noteAuthorName}
                                  onStatusChange={s => setStudentStatus(student.id, s)}
                                  onExcuseNoteChange={n => setExcuseNote(student.id, n)}
                                  onRatingChange={r => setStudentRating(student.id, r)}
                                />
                              );
                            })}
                          </View>
                        </View>
                      </View>
                    )}
              </View>

              {/* Footer */}
              <View
                className="gap-2 px-5 py-4"
                style={{ borderTopWidth: 1, borderTopColor: c.neutral.rule, backgroundColor: c.neutral.card }}
              >
                <Text style={{ fontSize: 13, color: c.neutral.inkMuted, textAlign: 'center', fontWeight: '500' }}>
                  {t('manager.attendance.markedCount', { marked: markedCount, total: totalCount, defaultValue: `Marked: ${markedCount}/${totalCount}` })}
                </Text>
                <Button
                  label={isSubmitting
                    ? t('manager.attendance.submitting', { defaultValue: 'Saving...' })
                    : t('manager.attendance.submitButton', { defaultValue: 'Save Attendance' })}
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={sessionNotActive || isSubmitting}
                  variant="default"
                />
                {error && (
                  <Text style={{ fontSize: 12, color: c.semantic.absent, textAlign: 'center' }}>{error}</Text>
                )}
              </View>
            </>
          )}

      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        disableAnimations
        confirmLabel={t('manager.common.ok', { defaultValue: 'OK' })}
        cancelLabel={t('manager.common.cancel', { defaultValue: 'Cancel' })}
        hideCancelButton={confirmModal.hideCancelButton}
        onConfirm={confirmModal.onConfirm}
        onCancel={dismissConfirm}
      />
    </SafeAreaView>
  );
}
