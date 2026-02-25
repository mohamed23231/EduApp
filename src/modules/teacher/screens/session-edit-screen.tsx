/**
 * SessionEditScreen — Teacher
 * Edit / delete a session template.
 * Time picker + searchable student picker via bottom sheets.
 */

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Student } from '../types';
import type { SessionFormValues } from '../validators';
import { Ionicons } from '@expo/vector-icons';
import * as Burnt from 'burnt';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Text, useModal } from '@/components/ui';
import {
  ConfirmSheet,
  DayOfWeekPicker,
  ScreenHeader,
  StudentSelectSheet,
  TimePickerSheet,
} from '../components';
import { useSessionCrud } from '../hooks';
import { getAvailableStudents, getTemplate } from '../services';
import { sessionSchema } from '../validators';

type FormErrors = Record<string, string>;

function parseZodErrors(error: unknown, t: (key: string) => string): FormErrors {
  if (error && typeof error === 'object' && 'issues' in error) {
    const ve: FormErrors = {};
    (error as { issues: { path: string[]; message: string }[] }).issues.forEach((issue) => {
      if (issue.path[0]) {
        ve[issue.path[0]] = t(issue.message);
      }
    });
    return ve;
  }
  return {};
}

type EditFormBodyProps = {
  formData: SessionFormValues;
  errors: FormErrors;
  isSubmitting: boolean;
  isDeleting: boolean;
  selectedStudentNames: string;
  timePicker: { present: () => void };
  studentPicker: { present: () => void };
  deleteModal: { present: () => void };
  handleChange: (field: keyof SessionFormValues) => (value: SessionFormValues[keyof SessionFormValues]) => void;
  handleSubmit: () => void;
  t: (key: string, opts?: any) => string;
};

function EditFormBody({
  formData,
  errors,
  isSubmitting,
  isDeleting,
  selectedStudentNames,
  timePicker,
  studentPicker,
  deleteModal,
  handleChange,
  handleSubmit,
  t,
}: EditFormBodyProps) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('teacher.sessions.subjectLabel')}</Text>
            <Input
              placeholder={t('teacher.sessions.subjectPlaceholder')}
              value={formData.subject}
              onChangeText={handleChange('subject') as (v: string) => void}
              error={errors.subject}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('teacher.sessions.daysLabel')}</Text>
            <DayOfWeekPicker
              selectedDays={formData.daysOfWeek}
              onDaysChange={handleChange('daysOfWeek') as (v: number[]) => void}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('teacher.sessions.timeLabel')}</Text>
            <Pressable
              onPress={timePicker.present}
              style={({ pressed }) => [styles.selectBtn, pressed && styles.selectBtnPressed, errors.time && styles.selectBtnError]}
            >
              <Ionicons name="time-outline" size={18} color={formData.time ? '#111827' : '#9CA3AF'} />
              <Text style={[styles.selectBtnText, !formData.time && styles.selectBtnPlaceholder]}>
                {formData.time || 'HH:mm'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
            </Pressable>
            {errors.time ? <Text style={styles.fieldError}>{errors.time}</Text> : null}
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('teacher.sessions.studentsLabel')}</Text>
            <Pressable
              onPress={studentPicker.present}
              style={({ pressed }) => [styles.selectBtn, pressed && styles.selectBtnPressed]}
            >
              <Ionicons name="people-outline" size={18} color={formData.studentIds.length > 0 ? '#111827' : '#9CA3AF'} />
              <Text style={[styles.selectBtnText, formData.studentIds.length === 0 && styles.selectBtnPlaceholder]} numberOfLines={1}>
                {formData.studentIds.length > 0
                  ? selectedStudentNames || t('teacher.sessions.studentCount', { count: formData.studentIds.length })
                  : t('teacher.sessions.selectStudents')}
              </Text>
              {formData.studentIds.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{formData.studentIds.length}</Text>
                </View>
              )}
              <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
            </Pressable>
          </View>
          {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}
          <View style={styles.buttonRow}>
            <Button
              label={t('teacher.sessions.saveButton')}
              onPress={handleSubmit}
              loading={isSubmitting}
              variant="default"
              style={styles.saveBtn}
            />
            <Button
              label={t('teacher.sessions.deleteButton')}
              onPress={() => deleteModal.present()}
              variant="destructive"
              disabled={isDeleting}
              style={styles.deleteBtn}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function useSessionEditState(id: string) {
  const router = useRouter();
  const { t } = useTranslation();
  const { updateSession, deleteSession, isSubmitting } = useSessionCrud();
  const deleteModal = useModal();
  const timePicker = useModal();
  const studentPicker = useModal();

  const [formData, setFormData] = useState<SessionFormValues>({ subject: '', daysOfWeek: [], time: '', studentIds: [] });
  const [errors, setErrors] = useState<FormErrors>({});
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id)
      return;
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const [template, students] = await Promise.all([getTemplate(id), getAvailableStudents(id)]);
        if (!cancelled) {
          // Strip seconds from HH:mm:ss → HH:mm for display
          const normalizedTime = template.time?.includes(':')
            ? template.time.split(':').slice(0, 2).join(':')
            : template.time;
          setFormData({
            subject: template.subject,
            daysOfWeek: template.daysOfWeek,
            time: normalizedTime,
            studentIds: template.assignedStudents.map((s: Student) => s.id),
          });
          setAvailableStudents(students);
        }
      }
      catch {
        if (!cancelled) {
          router.back();
        }
      }
      finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const handleChange = (field: keyof SessionFormValues) => (value: SessionFormValues[keyof SessionFormValues]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    try {
      sessionSchema.parse(formData);
      await updateSession(id, formData);
      Burnt.toast({ title: t('teacher.common.save'), preset: 'done', haptic: 'success' });
      router.back();
    }
    catch (error) {
      const ve = parseZodErrors(error, t); setErrors(Object.keys(ve).length
        ? ve
        : { form: error instanceof Error ? error.message : t('teacher.common.genericError') });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSession(id);
      deleteModal.dismiss();
      Burnt.toast({ title: t('teacher.sessions.deleteSuccess'), preset: 'done', haptic: 'success' });
      router.back();
    }
    catch {
      Burnt.toast({ title: t('teacher.common.genericError'), preset: 'error', haptic: 'error' });
      setIsDeleting(false);
      deleteModal.dismiss();
    }
  };

  return {
    t,
    formData,
    errors,
    availableStudents,
    isLoading,
    isSubmitting,
    isDeleting,
    deleteModal,
    timePicker,
    studentPicker,
    handleChange,
    handleSubmit,
    handleDelete,
  };
}

export function SessionEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useSessionEditState(id ?? '');
  const {
    t,
    formData,
    errors,
    availableStudents,
    isLoading,
    isSubmitting,
    isDeleting,
    deleteModal,
    timePicker,
    studentPicker,
    handleChange,
    handleSubmit,
    handleDelete,
  } = state;

  const selectedStudentNames = availableStudents
    .filter((s: Student) => formData.studentIds.includes(s.id))
    .map((s: Student) => s.name)
    .join(', ');

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScreenHeader title={t('teacher.sessions.editTitle')} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScreenHeader title={t('teacher.sessions.editTitle')} />
      <EditFormBody
        formData={formData}
        errors={errors}
        isSubmitting={isSubmitting}
        isDeleting={isDeleting}
        selectedStudentNames={selectedStudentNames}
        timePicker={timePicker}
        studentPicker={studentPicker}
        deleteModal={deleteModal}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        t={t}
      />
      <TimePickerSheet
        ref={timePicker.ref as React.RefObject<BottomSheetModal | null>}
        value={formData.time}
        onChange={handleChange('time') as (v: string) => void}
      />
      <StudentSelectSheet
        ref={studentPicker.ref as React.RefObject<BottomSheetModal | null>}
        availableStudents={availableStudents}
        selectedIds={formData.studentIds}
        onConfirm={handleChange('studentIds') as (v: string[]) => void}
      />
      <ConfirmSheet
        ref={deleteModal.ref as React.RefObject<BottomSheetModal | null>}
        title={t('teacher.sessions.deleteConfirmTitle')}
        message={t('teacher.sessions.deleteConfirmMessage')}
        confirmLabel={t('teacher.sessions.delete')}
        cancelLabel={t('teacher.common.cancel')}
        onConfirm={handleDelete}
        onCancel={deleteModal.dismiss}
        isLoading={isDeleting}
        variant="destructive"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 20,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectBtnPressed: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  selectBtnError: {
    borderColor: '#FCA5A5',
  },
  selectBtnText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  selectBtnPlaceholder: {
    color: '#9CA3AF',
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fieldError: {
    fontSize: 12,
    color: '#DC2626',
  },
  formError: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveBtn: {
    flex: 1,
  },
  deleteBtn: {
    flex: 1,
  },
});
