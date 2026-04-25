/**
 * SessionCreateScreen — Teacher
 * Create a session template with proper time picker and
 * searchable student select bottom sheet.
 */

import type { Student } from '../types';
import type { SessionFormValues } from '../validators';
import { Ionicons } from '@expo/vector-icons';
import * as Burnt from 'burnt';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Text, useModal } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import { DayOfWeekPicker, ScreenHeader, StudentSelectSheet, TimePickerSheet } from '../components';
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

type FormCardProps = {
  formData: SessionFormValues;
  errors: FormErrors;
  availableStudents: Student[];
  isSubmitting: boolean;
  selectedStudentNames: string;
  set: (field: keyof SessionFormValues) => (value: SessionFormValues[keyof SessionFormValues]) => void;
  onSubmit: () => void;
  onTimePicker: () => void;
  onStudentPicker: () => void;
  t: (key: string, opts?: any) => string;
};

function SessionFormCard({
  formData,
  errors,
  isSubmitting,
  selectedStudentNames,
  set,
  onSubmit,
  onTimePicker,
  onStudentPicker,
  t,
}: FormCardProps) {
  return (
    <View style={styles.card}>
      <Animated.View entering={FadeInDown.delay(0).duration(350)} style={styles.formGroup}>
        <Text style={styles.label}>{t('teacher.sessions.subjectLabel')}</Text>
        <Input
          placeholder={t('teacher.sessions.subjectPlaceholder')}
          value={formData.subject}
          onChangeText={set('subject') as (v: string) => void}
          error={errors.subject}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.formGroup}>
        <Text style={styles.label}>{t('teacher.sessions.daysLabel')}</Text>
        <DayOfWeekPicker
          selectedDays={formData.daysOfWeek}
          onDaysChange={set('daysOfWeek') as (v: number[]) => void}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(350)} style={styles.formGroup}>
        <Text style={styles.label}>{t('teacher.sessions.timeLabel')}</Text>
        <Pressable
          onPress={onTimePicker}
          style={({ pressed }) => [styles.selectBtn, pressed && styles.selectBtnPressed, errors.time && styles.selectBtnError]}
        >
          <Ionicons name="time-outline" size={18} color={formData.time ? '#111827' : '#9CA3AF'} />
          <Text style={[styles.selectBtnText, !formData.time && styles.selectBtnPlaceholder]}>
            {formData.time || 'HH:mm'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
        </Pressable>
        {errors.time ? <Text style={styles.fieldError}>{errors.time}</Text> : null}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).duration(350)} style={styles.formGroup}>
        <Text style={styles.label}>{t('teacher.sessions.studentsLabel')}</Text>
        <Pressable
          onPress={onStudentPicker}
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
      </Animated.View>

      {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

      <Animated.View entering={FadeInDown.delay(320).duration(350)}>
        <Button
          label={t('teacher.sessions.createButton')}
          onPress={onSubmit}
          loading={isSubmitting}
          variant="default"
        />
      </Animated.View>
    </View>
  );
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
      const ve = parseZodErrors(error, t); setErrors(Object.keys(ve).length
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
            availableStudents={availableStudents}
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
    backgroundColor: '#F9FAFB',
  },
  flex: {
    flex: 1,
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
});
