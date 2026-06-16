/**
 * StudentForm — student-create
 * Student creation form fields (name, grade, parent phone, notes, submit).
 * Extracted from student-create-screen.
 */

import type { CreateStudentFormValues } from '../../validators';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, Input, PhoneField, Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type StudentFormProps = {
  formData: CreateStudentFormValues;
  errors: Record<string, string>;
  isSubmitting: boolean;
  onFieldChange: (field: keyof CreateStudentFormValues) => (value: string) => void;
  parentCountryCode: string;
  parentLocalNumber: string;
  onParentCountryCodeChange: (value: string) => void;
  onParentLocalNumberChange: (value: string) => void;
  onSubmit: () => void;
};

export function StudentForm({
  formData,
  errors,
  isSubmitting,
  onFieldChange,
  parentCountryCode,
  parentLocalNumber,
  onParentCountryCodeChange,
  onParentLocalNumberChange,
  onSubmit,
}: StudentFormProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.form}>
      <Animated.View entering={FadeInDown.delay(0).duration(350)} style={styles.formGroup}>
        <Text style={styles.label}>{t('teacher.students.form.nameLabel')}</Text>
        <Input
          placeholder={t('teacher.students.form.namePlaceholder')}
          value={formData.name}
          onChangeText={onFieldChange('name')}
          error={errors.name}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.formGroup}>
        <Text style={styles.label}>{t('teacher.students.form.gradeLabel')}</Text>
        <Input
          placeholder={t('teacher.students.form.gradePlaceholder')}
          value={formData.gradeLevel}
          onChangeText={onFieldChange('gradeLevel')}
          error={errors.gradeLevel}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(350)} style={styles.formGroup}>
        <PhoneField
          label={t('teacher.students.form.parentPhoneLabel')}
          countryCode={parentCountryCode}
          localNumber={parentLocalNumber}
          onCountryCodeChange={onParentCountryCodeChange}
          onLocalNumberChange={onParentLocalNumberChange}
          error={errors.parentPhone}
          testIDPrefix="student-parent-phone"
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).duration(350)} style={styles.formGroup}>
        <Text style={styles.label}>{t('teacher.students.form.notesLabel')}</Text>
        <Input
          placeholder={t('teacher.students.form.notesPlaceholder')}
          value={formData.notes}
          onChangeText={onFieldChange('notes')}
          error={errors.notes}
          multiline
          numberOfLines={4}
        />
      </Animated.View>

      {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

      <Animated.View entering={FadeInDown.delay(320).duration(350)}>
        <Button
          label={isSubmitting ? t('teacher.students.submitting') : t('teacher.students.createButton')}
          onPress={onSubmit}
          loading={isSubmitting}
          variant="default"
          style={styles.submitBtn}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  formError: {
    fontSize: 13,
    color: colors.semantic.absent,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: 8,
  },
});
