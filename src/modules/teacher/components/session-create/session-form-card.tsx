/**
 * SessionFormCard — session-create
 * Staggered form card: subject, days, time, students, create CTA.
 * Extracted from session-create-screen.
 */

import type { SessionFormValues } from '../../validators';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, Input, Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { DayOfWeekPicker } from '../day-of-week-picker';
import { SelectField } from './select-field';

type FormErrors = Record<string, string>;

type FormCardProps = {
  formData: SessionFormValues;
  errors: FormErrors;
  isSubmitting: boolean;
  selectedStudentNames: string;
  set: (field: keyof SessionFormValues) => (value: SessionFormValues[keyof SessionFormValues]) => void;
  onSubmit: () => void;
  onTimePicker: () => void;
  onStudentPicker: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
};

export function SessionFormCard({
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
  const studentsLabel = formData.studentIds.length > 0
    ? selectedStudentNames || t('teacher.sessions.studentCount', { count: formData.studentIds.length })
    : t('teacher.sessions.selectStudents');

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
        <SelectField
          icon="time-outline"
          label={formData.time || 'HH:mm'}
          isPlaceholder={!formData.time}
          hasError={!!errors.time}
          onPress={onTimePicker}
        />
        {errors.time ? <Text style={styles.fieldError}>{errors.time}</Text> : null}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).duration(350)} style={styles.formGroup}>
        <Text style={styles.label}>{t('teacher.sessions.studentsLabel')}</Text>
        <SelectField
          icon="people-outline"
          label={studentsLabel}
          isPlaceholder={formData.studentIds.length === 0}
          count={formData.studentIds.length}
          onPress={onStudentPicker}
        />
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

const styles = StyleSheet.create({
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
});
