/**
 * OnboardingScreen — Teacher
 * A6 visual grammar: tone-tinted glow blob, monogram preview, tone picker,
 * name + phone form, dot strip progress indicator.
 * Preserves all existing API calls and navigation.
 */

import type { TeacherOnboardingFormValues } from '../validators';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, PhoneField, Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { getToken, isTokenExpiringWithin } from '@/lib/auth/utils';
import { refreshToken } from '@/modules/auth/services';
import {
  buildE164Phone,
  DEFAULT_COUNTRY_CODE,
  getPhoneValidationErrorKey,
} from '@/shared/utils/phone';
import { DotStrip } from '../components/onboarding/dot-strip';
import {
  MonogramPreview,
  TONE_PALETTE,
  TonePicker,
} from '../components/onboarding/monogram-preview';
import { createTeacherProfile, getTeacherIdHash, trackOnboardingCompleted } from '../services';
import { getErrorDetails, logError } from '../services/logger';
import { teacherOnboardingSchema } from '../validators';

function extractValidationErrors(error: unknown): Record<string, string> | null {
  if (error && typeof error === 'object' && 'issues' in error) {
    const result: Record<string, string> = {};
    (error as { issues: Array<{ path: unknown[]; message: string }> }).issues.forEach((issue) => {
      const key = issue.path[0];
      if (typeof key === 'string')
        result[key] = issue.message;
    });
    return result;
  }
  return null;
}

// eslint-disable-next-line max-lines-per-function
export function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const onboardingContext = useAuthStore.use.onboardingContext();
  const user = useAuthStore.use.user();

  const [formData, setFormData] = useState<TeacherOnboardingFormValues>({
    name: onboardingContext?.fullName ?? '',
    phone: '',
  });
  const [phoneCountryCode, setPhoneCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [phoneLocalNumber, setPhoneLocalNumber] = useState('');
  const [selectedTone, setSelectedTone] = useState('tone3');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canContinue = formData.name.trim().length >= 2 && !isSubmitting;
  const glowColor = TONE_PALETTE[selectedTone] ?? colors.neutral.paper;

  const handleFieldChange = (field: keyof TeacherOnboardingFormValues) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field])
      setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handlePhoneCountryCodeChange = (value: string) => {
    setPhoneCountryCode(value);
    const composed = buildE164Phone(value, phoneLocalNumber);
    setFormData(prev => ({ ...prev, phone: composed ?? '' }));
    if (errors.phone)
      setErrors(prev => ({ ...prev, phone: '' }));
  };

  const handlePhoneLocalNumberChange = (value: string) => {
    setPhoneLocalNumber(value);
    const composed = buildE164Phone(phoneCountryCode, value);
    setFormData(prev => ({ ...prev, phone: composed ?? '' }));
    if (errors.phone)
      setErrors(prev => ({ ...prev, phone: '' }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const normalizedPhone = buildE164Phone(phoneCountryCode, phoneLocalNumber);
      const hasPhoneInput = phoneLocalNumber.trim().length > 0;
      if (hasPhoneInput && !normalizedPhone) {
        setErrors(prev => ({ ...prev, phone: getPhoneValidationErrorKey(phoneCountryCode) }));
        return;
      }
      const payload = { ...formData, phone: normalizedPhone ?? '' };
      teacherOnboardingSchema.parse(payload);

      const token = getToken();
      if (token?.access && isTokenExpiringWithin(token.access, 60)) {
        try {
          const result = await refreshToken(token.refresh);
          void result;
        }
        catch {
          logError({ screen: 'OnboardingScreen', action: 'tokenRefresh', errorCode: 'TOKEN_REFRESH_FAILED', statusCode: 0, message: 'Failed to refresh token before profile submission' });
        }
      }

      await createTeacherProfile({ name: payload.name, phone: payload.phone || undefined });
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
        setErrors({ form: error instanceof Error ? error.message : t('teacher.common.genericError', 'Something went wrong') });
      }
    }
    finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      {/* Tone-tinted glow blob */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -120,
          [I18nManager.isRTL ? 'left' : 'right']: -120,
          width: 320,
          height: 320,
          borderRadius: 999,
          backgroundColor: glowColor,
          opacity: 0.6,
        }}
      />

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 48, paddingTop: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInDown.delay(0).duration(400)}>
            <Text className="text-micro font-bold tracking-widest text-ink-muted uppercase">
              {t('teacher.onboarding.stepLabel', 'Step 1 of 1')}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60).duration(400)} className="mt-2 mb-6">
            <Text className="font-bold text-ink" style={{ fontSize: 30, letterSpacing: -1, lineHeight: 33 }}>
              {t('teacher.onboarding.headline', 'Welcome.\nLet\'s set up your\nprofile.')}
            </Text>
            <Text className="mt-2 text-body-lg text-ink-muted">
              {t('teacher.onboarding.subheadline', 'How should parents see you in the app?')}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(400)} className="mb-5 items-center">
            <MonogramPreview name={formData.name} tone={selectedTone} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(400)} className="mb-4">
            <Text className="mb-2 text-caption font-bold tracking-wide text-ink-muted uppercase">
              {t('teacher.onboarding.nameLabel', 'Your name')}
            </Text>
            <Input
              placeholder={t('teacher.onboarding.namePlaceholder', 'Enter your full name')}
              value={formData.name}
              onChangeText={handleFieldChange('name')}
              error={errors.name}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).duration(400)} className="mb-5">
            <Text className="mb-2 text-caption font-bold tracking-wide text-ink-muted uppercase">
              {t('teacher.onboarding.avatarToneLabel', 'Avatar tone')}
            </Text>
            <TonePicker selected={selectedTone} onChange={setSelectedTone} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(260).duration(400)} className="mb-4">
            <PhoneField
              label={t('teacher.onboarding.phoneLabel', 'Phone Number')}
              countryCode={phoneCountryCode}
              localNumber={phoneLocalNumber}
              onCountryCodeChange={handlePhoneCountryCodeChange}
              onLocalNumberChange={handlePhoneLocalNumberChange}
              error={errors.phone}
              testIDPrefix="teacher-onboarding-phone"
            />
          </Animated.View>

          {errors.form && (
            <Text className="mb-4 text-center text-body" style={{ color: colors.semantic.absent }}>
              {errors.form}
            </Text>
          )}

          <View className="my-4">
            <DotStrip step={1} total={1} />
          </View>

          <Animated.View entering={FadeInDown.delay(320).duration(400)}>
            <Pressable
              onPress={canContinue ? handleSubmit : undefined}
              disabled={!canContinue}
              accessibilityRole="button"
              accessibilityLabel={isSubmitting
                ? t('teacher.onboarding.submitting', 'Setting up...')
                : t('teacher.onboarding.submit', 'Complete Setup')}
              className="items-center justify-center rounded-2xl py-4"
              style={({ pressed }) => [
                {
                  backgroundColor: canContinue ? colors.neutral.ink : colors.neutral.rule,
                  opacity: pressed && canContinue ? 0.85 : 1,
                },
              ]}
            >
              <Text
                className="text-body-lg font-bold"
                style={{ color: canContinue ? '#fff' : colors.neutral.inkMuted }}
              >
                {isSubmitting
                  ? t('teacher.onboarding.submitting', 'Setting up...')
                  : t('teacher.onboarding.submit', 'Complete Setup')}
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
