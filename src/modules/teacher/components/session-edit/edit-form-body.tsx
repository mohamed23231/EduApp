/**
 * EditFormBody — session-edit
 * Scrollable form card: subject, days, time, students, save/delete CTAs.
 * Extracted from session-edit-screen.
 */

import type { SessionFormValues } from '../../validators';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Input, Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { DayOfWeekPicker } from '../day-of-week-picker';
import { SelectField } from './select-field';

type FormErrors = Record<string, string>;

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
  t: (key: string, opts?: Record<string, unknown>) => string;
};

export function EditFormBody({
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
  const studentsLabel = formData.studentIds.length > 0
    ? selectedStudentNames || t('teacher.sessions.studentCount', { count: formData.studentIds.length })
    : t('teacher.sessions.selectStudents');

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
            <SelectField
              icon="time-outline"
              label={formData.time || 'HH:mm'}
              isPlaceholder={!formData.time}
              hasError={!!errors.time}
              onPress={timePicker.present}
            />
            {errors.time ? <Text style={styles.fieldError}>{errors.time}</Text> : null}
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('teacher.sessions.studentsLabel')}</Text>
            <SelectField
              icon="people-outline"
              label={studentsLabel}
              isPlaceholder={formData.studentIds.length === 0}
              count={formData.studentIds.length}
              onPress={studentPicker.present}
            />
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

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.neutral.card,
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
    color: colors.neutral.inkSoft,
  },
  fieldError: {
    fontSize: 12,
    color: colors.semantic.absent,
  },
  formError: {
    fontSize: 13,
    color: colors.semantic.absent,
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
