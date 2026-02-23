/**
 * StudentCreateScreen component
 * Form for creating a new student
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Text } from '@/components/ui';
import { useStudentCrud } from '../hooks';
import type { StudentFormValues } from '../validators';
import { studentSchema } from '../validators';

export function StudentCreateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { createStudent, isSubmitting } = useStudentCrud();

  const [formData, setFormData] = useState<StudentFormValues>({
    name: '',
    gradeLevel: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (field: keyof StudentFormValues) => (value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    try {
      studentSchema.parse(formData);
      await createStudent(formData);
      router.back();
    }
    catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        const validationErrors: Record<string, string> = {};
        (error as any).issues.forEach((issue: any) => {
          if (issue.path[0]) {
            validationErrors[issue.path[0]] = issue.message;
          }
        });
        setErrors(validationErrors);
      }
      else {
        setErrors({
          form: error instanceof Error ? error.message : t('teacher.common.genericError'),
        });
      }
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.keyboardAvoidingView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>{t('teacher.common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('teacher.students.createTitle')}</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('teacher.students.form.nameLabel')}</Text>
              <Input
                placeholder={t('teacher.students.form.namePlaceholder')}
                value={formData.name}
                onChangeText={handleFieldChange('name')}
                error={errors.name}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('teacher.students.form.gradeLabel')}</Text>
              <Input
                placeholder={t('teacher.students.form.gradePlaceholder')}
                value={formData.gradeLevel}
                onChangeText={handleFieldChange('gradeLevel')}
                error={errors.gradeLevel}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('teacher.students.form.notesLabel')}</Text>
              <Input
                placeholder={t('teacher.students.form.notesPlaceholder')}
                value={formData.notes}
                onChangeText={handleFieldChange('notes')}
                error={errors.notes}
                multiline
                numberOfLines={4}
              />
            </View>

            {errors.form && (
              <Text style={styles.formError}>{errors.form}</Text>
            )}

            <Button
              label={isSubmitting ? t('teacher.students.submitting') : t('teacher.students.createButton')}
              onPress={handleSubmit}
              loading={isSubmitting}
              variant="default"
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoidingView: {
    flex: 1,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  form: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  formError: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 8,
  },
});
