/**
 * OnboardingScreen component
 * Teacher onboarding form
 */

import type { TeacherOnboardingFormValues } from '../validators';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Text } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { getToken, isTokenExpiringWithin } from '@/lib/auth/utils';
import { refreshToken } from '@/modules/auth/services';
import { createTeacherProfile, getTeacherIdHash, trackOnboardingCompleted } from '../services';
import { getErrorDetails, logError } from '../services/logger';
import { teacherOnboardingSchema } from '../validators';

/** Handle form validation errors from Zod */
function extractValidationErrors(error: unknown): Record<string, string> | null {
  if (error && typeof error === 'object' && 'issues' in error) {
    const validationErrors: Record<string, string> = {};
    (error as any).issues.forEach((issue: any) => {
      if (issue.path[0])
        validationErrors[issue.path[0]] = issue.message;
    });
    return validationErrors;
  }
  return null;
}

/** Onboarding form fields */
function OnboardingForm({
  formData,
  errors,
  isSubmitting,
  onFieldChange,
  onSubmit,
}: {
  formData: TeacherOnboardingFormValues;
  errors: Record<string, string>;
  isSubmitting: boolean;
  onFieldChange: (field: keyof TeacherOnboardingFormValues) => (value: any) => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.form}>
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.formGroup}>
        <Text style={styles.label}>{t('teacher.onboarding.nameLabel')}</Text>
        <Input
          placeholder={t('teacher.onboarding.namePlaceholder')}
          value={formData.name}
          onChangeText={onFieldChange('name')}
          error={errors.name}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.formGroup}>
        <Text style={styles.label}>{t('teacher.onboarding.phoneLabel')}</Text>
        <Input
          placeholder={t('teacher.onboarding.phonePlaceholder')}
          value={formData.phone}
          onChangeText={onFieldChange('phone')}
          error={errors.phone}
          keyboardType="phone-pad"
        />
      </Animated.View>

      {errors.form && <Text style={styles.formError}>{errors.form}</Text>}

      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <Button
          label={isSubmitting ? t('teacher.onboarding.submitting') : t('teacher.onboarding.submit')}
          onPress={onSubmit}
          loading={isSubmitting}
          variant="default"
          style={styles.submitButton}
        />
      </Animated.View>
    </View>
  );
}

export function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const onboardingContext = useAuthStore.use.onboardingContext();
  const user = useAuthStore.use.user();

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
      teacherOnboardingSchema.parse(formData);

      // Preemptive token refresh
      const token = getToken();
      if (token?.access && isTokenExpiringWithin(token.access, 60)) {
        try {
          const result = await refreshToken(token.refresh);
          // Token is updated via the auth store interceptor
          void result;
        }
        catch {
          logError({ screen: 'OnboardingScreen', action: 'tokenRefresh', errorCode: 'TOKEN_REFRESH_FAILED', statusCode: 0, message: 'Failed to refresh token before profile submission' });
        }
      }

      await createTeacherProfile({ name: formData.name, phone: formData.phone });
      if (user?.id)
        trackOnboardingCompleted(getTeacherIdHash(user.id));
      router.replace('/(teacher)/dashboard' as any);
    }
    catch (error) {
      const { code, message, status } = getErrorDetails(error);
      logError({ screen: 'OnboardingScreen', action: 'handleSubmit', errorCode: code, statusCode: status, message });

      const validationErrors = extractValidationErrors(error);
      if (validationErrors) {
        setErrors(validationErrors);
      }
      else {
        setErrors({ form: error instanceof Error ? error.message : t('teacher.common.genericError') });
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
          <Animated.View entering={FadeInDown.delay(0).duration(400)}>
            <View style={styles.illustrationContainer}>
              <View style={styles.illustration}>
                <Ionicons name="school" size={44} color="#3B82F6" />
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
            <Text style={styles.title}>{t('teacher.onboarding.title')}</Text>
            <Text style={styles.subtitle}>{t('teacher.onboarding.subtitle')}</Text>
          </Animated.View>

          <OnboardingForm
            formData={formData}
            errors={errors}
            isSubmitting={isSubmitting}
            onFieldChange={handleFieldChange}
            onSubmit={handleSubmit}
          />
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
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  illustration: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
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
