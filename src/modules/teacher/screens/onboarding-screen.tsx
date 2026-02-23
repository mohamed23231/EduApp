/**
 * OnboardingScreen component
 * Teacher onboarding form
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Text } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { createTeacherProfile } from '../services';
import type { TeacherOnboardingFormValues } from '../validators';
import { teacherOnboardingSchema } from '../validators';

export function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const onboardingContext = useAuthStore.use.onboardingContext();

  const [formData, setFormData] = useState<TeacherOnboardingFormValues>({
    name: onboardingContext?.fullName || '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (field: keyof TeacherOnboardingFormValues) => (value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validate form
      teacherOnboardingSchema.parse(formData);

      // Create teacher profile
      await createTeacherProfile({
        name: formData.name,
        phone: formData.phone,
      });

      // Navigate to dashboard
      router.replace('/(teacher)/dashboard' as any);
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
    finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.keyboardAvoidingView}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('teacher.onboarding.title')}</Text>
            <Text style={styles.subtitle}>{t('teacher.onboarding.subtitle')}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('teacher.onboarding.nameLabel')}</Text>
              <Input
                placeholder={t('teacher.onboarding.namePlaceholder')}
                value={formData.name}
                onChangeText={handleFieldChange('name')}
                error={errors.name}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('teacher.onboarding.phoneLabel')}</Text>
              <Input
                placeholder={t('teacher.onboarding.phonePlaceholder')}
                value={formData.phone}
                onChangeText={handleFieldChange('phone')}
                error={errors.phone}
                keyboardType="phone-pad"
              />
            </View>

            {errors.form && (
              <Text style={styles.formError}>{errors.form}</Text>
            )}

            <Button
              label={isSubmitting ? t('teacher.onboarding.submitting') : t('teacher.onboarding.submit')}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    gap: 20,
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
    textAlign: 'center',
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 8,
  },
});
