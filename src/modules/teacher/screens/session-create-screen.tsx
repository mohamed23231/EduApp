/**
 * SessionCreateScreen component
 * Form for creating a new session template
 * Validates: Requirements 2.1, 3.1, 6.1, 6.2, 6.3, 6.4, 7.1, 11.1, 11.3, 13.1, 14.1
 */

import type { SessionFormValues } from '../validators';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Text } from '@/components/ui';
import { DayOfWeekPicker, StudentPicker } from '../components';
import { useSessionCrud } from '../hooks';
import { sessionSchema } from '../validators';

export function SessionCreateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { createSession, isSubmitting } = useSessionCrud();

  const [formData, setFormData] = useState<SessionFormValues>({
    subject: '',
    daysOfWeek: [],
    time: '',
    studentIds: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableStudents] = useState<any[]>([]);

  const handleFieldChange = (field: keyof SessionFormValues) => (value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate form
      sessionSchema.parse(formData);

      await createSession(formData);

      // Navigate back to dashboard
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>{t('teacher.common.back')}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{t('teacher.sessions.createTitle')}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('teacher.sessions.subjectLabel')}</Text>
              <Input
                placeholder={t('teacher.sessions.subjectPlaceholder')}
                value={formData.subject}
                onChangeText={handleFieldChange('subject')}
                error={errors.subject}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('teacher.sessions.daysLabel')}</Text>
              <DayOfWeekPicker
                selectedDays={formData.daysOfWeek}
                onDaysChange={handleFieldChange('daysOfWeek')}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('teacher.sessions.timeLabel')}</Text>
              <Input
                placeholder="HH:mm"
                value={formData.time}
                onChangeText={handleFieldChange('time')}
                error={errors.time}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('teacher.sessions.studentsLabel')}</Text>
              <StudentPicker
                availableStudents={availableStudents}
                selectedIds={formData.studentIds}
                onSelectionChange={handleFieldChange('studentIds')}
              />
            </View>

            {errors.form && (
              <Text style={styles.formError}>{errors.form}</Text>
            )}

            <Button
              label={t('teacher.sessions.createButton')}
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
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    fontSize: 16,
    color: '#3B82F6',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  formError: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 8,
  },
});
