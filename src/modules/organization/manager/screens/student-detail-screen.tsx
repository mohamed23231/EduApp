/**
 * StudentDetailScreen — Manager
 * Shows student hero, connection code, assigned sessions, and performance stats.
 */

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, I18nManager, Pressable, TextInput, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  Text,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { Modal, useModal } from '@/components/ui/modal';
import { AppRoute } from '@/core/navigation/routes';
import { AtRiskCallout } from '../components/student-detail/at-risk-callout';
import { ConnectionCodeCard } from '../components/student-detail/connection-code-card';
import { PerformanceStats } from '../components/student-detail/performance-stats';
import { StudentEditSection } from '../components/student-detail/student-edit-section';
import { StudentHero } from '../components/student-detail/student-hero';
import {
  useDeleteStudent,
  useOrgStudent,
  useOrgStudentStats,
  useRegenerateStudentCode,
  useUpdateStudent,
} from '../hooks';
import { useManagerStore } from '../store/manager-store';

type Range = 'week' | 'month' | 'term';

// eslint-disable-next-line max-lines-per-function
export function StudentDetailScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const [range, setRange] = useState<Range>('month');
  const [noteText, setNoteText] = useState('');
  const noteModal = useModal();
  // Typed ref satisfies BottomSheetModal type — actual imperative handle is owned by noteModal.
  const _noteSheetRef = useRef<BottomSheetModal | null>(null);

  const studentQuery = useOrgStudent(activeOrgId, params.id);
  const statsQuery = useOrgStudentStats(activeOrgId, params.id, range);
  const deleteMutation = useDeleteStudent(activeOrgId);
  const regenerateMutation = useRegenerateStudentCode(activeOrgId);
  const updateMutation = useUpdateStudent(activeOrgId);

  const student = studentQuery.data;
  const stats = statsQuery.data;

  const ratingDelta = useMemo(() => stats?.ratingDelta ?? 0, [stats]);

  const isAtRisk = (stats?.atRiskReason?.isAtRisk ?? false) || (student?.isAtRiskManualFlag ?? false);
  const atRiskTriggers = useMemo(() => {
    if (stats?.atRiskReason?.atRiskTriggers?.length) {
      return stats.atRiskReason.atRiskTriggers;
    }
    if (student?.isAtRiskManualFlag) {
      return [t('manager.students.atRisk.manualFlag', { defaultValue: 'Manually flagged' })];
    }
    return [];
  }, [stats, student, t]);

  const handleOpenNoteSheet = useCallback(() => {
    setNoteText('');
    noteModal.present();
  }, [noteModal]);

  const handleSaveNote = useCallback(() => {
    if (!student || !noteText.trim())
      return;
    updateMutation.mutate(
      { studentId: student.id, input: { tone: noteText.trim() } },
      { onSuccess: () => noteModal.dismiss() },
    );
  }, [student, noteText, updateMutation, noteModal]);

  const handleDelete = useCallback(() => {
    if (!student)
      return;
    Alert.alert(
      t('manager.students.deleteTitle', { defaultValue: 'Delete student?' }),
      t('manager.students.deleteMessage', { defaultValue: 'This will remove the student from future sessions. Historical data is preserved.' }),
      [
        { text: t('manager.common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('manager.students.deleteConfirm', { defaultValue: 'Delete' }),
          style: 'destructive',
          onPress: () => deleteMutation.mutate(student.id, { onSuccess: () => router.back() }),
        },
      ],
    );
  }, [student, deleteMutation, router, t]);

  const handleRegenerate = useCallback(() => {
    if (!student)
      return;
    Alert.alert(
      t('manager.students.regenerateTitle', { defaultValue: 'Regenerate code?' }),
      t('manager.students.regenerateMessage', { defaultValue: 'The old code will stop working immediately.' }),
      [
        { text: t('manager.common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        { text: t('manager.students.actions.regenerate', { defaultValue: 'Regenerate code' }), onPress: () => regenerateMutation.mutate(student.id) },
      ],
    );
  }, [student, regenerateMutation, t]);

  if (studentQuery.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.paper }} className="items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (studentQuery.isError || !student) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.paper }} className="items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={40} color={colors.semantic.absent} />
        <Text className="mt-3 text-center text-base" style={{ color: colors.semantic.absent }}>
          {t('manager.studentDetail.loadError', { defaultValue: 'Failed to load student.' })}
        </Text>
        <Button
          className="mt-4"
          variant="outline"
          label={t('manager.studentDetail.retry', { defaultValue: 'Retry' })}
          fullWidth={false}
          onPress={() => studentQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      <ScrollView contentContainerClassName="pt-5 pb-10">

        {/* Dark hero */}
        <StudentHero
          name={student.name}
          gradeLevel={student.gradeLevel ?? undefined}
          attendanceRate={stats?.attendanceRate ?? 0}
          averageRating={stats?.averageRating ?? 0}
          ratingDelta={ratingDelta}
          atRisk={isAtRisk}
        />

        {/* Connection code */}
        <ConnectionCodeCard name={student.name} connectionCode={student.connectionCode} t={t} />

        {/* At-risk callout */}
        {isAtRisk && atRiskTriggers.length > 0 && (
          <AtRiskCallout
            triggers={atRiskTriggers}
            parentPhone={student.parentPhone ?? undefined}
            parentName={student.name}
            onAddNote={handleOpenNoteSheet}
            t={t}
          />
        )}

        {/* Assigned sessions */}
        <View className="mb-4 px-4">
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.neutral.inkMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
            {t('manager.studentDetail.assignedSessions', { defaultValue: 'Assigned sessions' })}
          </Text>
          {(!student.assignedSessions || student.assignedSessions.length === 0)
            ? (
                <View className="items-center rounded-2xl py-6" style={{ backgroundColor: colors.neutral.card, borderWidth: 1, borderColor: colors.neutral.rule }}>
                  <Ionicons name="calendar-outline" size={24} color={colors.neutral.dim} />
                  <Text style={{ fontSize: 13, color: colors.neutral.inkMuted, marginTop: 6 }}>
                    {t('manager.studentDetail.noSessions', { defaultValue: 'Not assigned to any sessions yet.' })}
                  </Text>
                </View>
              )
            : (
                <View className="gap-2">
                  {student.assignedSessions.map(session => (
                    <Pressable
                      key={session.templateId}
                      onPress={() => router.push(AppRoute.manager.sessionDetail(session.templateId))}
                      className="flex-row items-center overflow-hidden rounded-2xl"
                      style={({ pressed }) => ({ backgroundColor: pressed ? colors.neutral.cardWarm : colors.neutral.card, borderWidth: 1, borderColor: colors.neutral.rule })}
                    >
                      <View style={{ width: 4, alignSelf: 'stretch', backgroundColor: colors.brand.primary }} />
                      <View className="flex-1 gap-0.5 px-3.5 py-3">
                        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.neutral.ink }}>{session.subject}</Text>
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="person-outline" size={12} color={colors.neutral.inkMuted} />
                          <Text style={{ fontSize: 12, color: colors.neutral.inkMuted }}>{session.teacherName}</Text>
                        </View>
                      </View>
                      <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.neutral.dim} style={{ marginEnd: 12 }} />
                    </Pressable>
                  ))}
                </View>
              )}
        </View>

        {/* Performance stats */}
        <PerformanceStats
          range={range}
          onRangeChange={setRange}
          isLoading={statsQuery.isLoading}
          isError={statsQuery.isError}
          stats={stats}
        />

        {/* Edit section — post-creation fields */}
        <StudentEditSection student={student} />

        {/* Danger actions */}
        <View className="mx-4 mt-8 pt-4" style={{ borderTopWidth: 1, borderTopColor: colors.neutral.rule }}>
          <Pressable
            onPress={handleRegenerate}
            className="flex-row items-center gap-3 rounded-xl px-1 py-3.5"
            style={({ pressed }) => ({ backgroundColor: pressed ? colors.semantic.excusedSoft : 'transparent' })}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.semantic.excused} />
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: colors.semantic.excused }}>
              {t('manager.students.actions.regenerate', { defaultValue: 'Regenerate code' })}
            </Text>
            <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.neutral.dim} />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            className="flex-row items-center gap-3 rounded-xl px-1 py-3.5"
            style={({ pressed }) => ({ borderTopWidth: 1, borderTopColor: colors.neutral.rule, backgroundColor: pressed ? colors.semantic.absentSoft : 'transparent' })}
          >
            <Ionicons name="trash-outline" size={20} color={colors.semantic.absent} />
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: colors.semantic.absent }}>
              {t('manager.students.actions.delete', { defaultValue: 'Delete' })}
            </Text>
            <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.neutral.dim} />
          </Pressable>
        </View>
      </ScrollView>

      {/* Add note bottom sheet */}
      <Modal ref={noteModal.ref} snapPoints={['50%']} title={t('manager.studentDetail.addNoteTitle', { defaultValue: 'Add note' })}>
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <TextInput
            style={{ flex: 1, fontSize: 15, color: colors.neutral.ink, textAlignVertical: 'top', paddingTop: 8 }}
            placeholder={t('manager.studentDetail.addNotePlaceholder', { defaultValue: 'Write a note about communication tone or context...' })}
            placeholderTextColor={colors.neutral.dim}
            value={noteText}
            onChangeText={setNoteText}
            multiline
            maxLength={500}
          />
          <Button
            label={t('manager.studentDetail.saveNote', { defaultValue: 'Save note' })}
            onPress={handleSaveNote}
            loading={updateMutation.isPending}
            disabled={!noteText.trim() || updateMutation.isPending}
            style={{ marginBottom: 16 }}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}
