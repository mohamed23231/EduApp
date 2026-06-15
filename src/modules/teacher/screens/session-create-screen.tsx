/**
 * SessionCreateScreen — Teacher
 * Create a session template with proper time picker and
 * searchable student select bottom sheet.
 */

import type { Student } from '../types';
import type { SessionFormValues } from '../validators';
import * as Burnt from 'burnt';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useModal } from '@/components/ui';
import colors from '@/components/ui/colors';
import { AppRoute } from '@/core/navigation/routes';
import { ScreenHeader, StudentSelectSheet, TimePickerSheet } from '../components';
import { SessionFormCard } from '../components/session-create';
import { useSessionCrud, useStudentSessions } from '../hooks';
import { extractErrorMessage, getStudents } from '../services';
import { sessionSchema } from '../validators';

type FormErrors = Record<string, string>;

function useStudentLoader(
  studentId: string | undefined,
  setFormData: React.Dispatch<React.SetStateAction<SessionFormValues>>,
) {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getStudents({ page: 1, limit: 500 });
        if (cancelled)
          return;
        setAllStudents(result.students);
        if (studentId && result.students.some((s: Student) => s.id === studentId)) {
          setFormData(prev => ({
            ...prev,
            studentIds: prev.studentIds.includes(studentId)
              ? prev.studentIds
              : [...prev.studentIds, studentId],
          }));
        }
      }
      catch {
        if (!cancelled)
          setAllStudents([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, setFormData]);
  return allStudents;
}

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

export function SessionCreateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId?: string }>();
  const { createSession, isSubmitting } = useSessionCrud();
  const timePicker = useModal();
  const studentPicker = useModal();

  const [formData, setFormData] = useState<SessionFormValues>({
    subject: '',
    daysOfWeek: [],
    time: '',
    studentIds: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const allStudents = useStudentLoader(params.studentId, setFormData);
  const { assignedStudentIds } = useStudentSessions();

  // Exclude students already assigned to other sessions.
  const availableStudents = allStudents.filter(s => !assignedStudentIds.has(s.id));

  // If a pre-selected studentId turns out to be already assigned, drop it from selection.
  useEffect(() => {
    if (assignedStudentIds.size === 0)
      return;
    setFormData(prev => ({
      ...prev,
      studentIds: prev.studentIds.filter(id => !assignedStudentIds.has(id)),
    }));
  }, [assignedStudentIds]);

  const set = (field: keyof SessionFormValues) => (value: SessionFormValues[keyof SessionFormValues]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    try {
      sessionSchema.parse(formData);
      await createSession(formData);
      Burnt.toast({ title: t('teacher.sessions.createButton'), preset: 'done', haptic: 'success' });
      router.replace(AppRoute.teacher.sessions as any);
    }
    catch (error) {
      const ve = parseZodErrors(error, t);
      setErrors(Object.keys(ve).length
        ? ve
        : { form: extractErrorMessage(error, t) });
    }
  };

  const selectedStudentNames = availableStudents
    .filter(s => formData.studentIds.includes(s.id))
    .map(s => s.name)
    .join(', ');

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScreenHeader title={t('teacher.sessions.createTitle')} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <SessionFormCard
            formData={formData}
            errors={errors}
            isSubmitting={isSubmitting}
            selectedStudentNames={selectedStudentNames}
            set={set}
            onSubmit={handleSubmit}
            onTimePicker={timePicker.present}
            onStudentPicker={studentPicker.present}
            t={t}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <TimePickerSheet
        ref={timePicker.ref}
        value={formData.time}
        onChange={set('time') as (v: string) => void}
      />

      <StudentSelectSheet
        ref={studentPicker.ref}
        availableStudents={availableStudents}
        selectedIds={formData.studentIds}
        onConfirm={set('studentIds') as (v: string[]) => void}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.paper,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
});
