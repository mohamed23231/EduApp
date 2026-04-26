import type { ParentInviteValidateResponse } from '../types';
import { useForm } from '@tanstack/react-form';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AuthFieldShell,
  AuthInput,
  AuthShell,
  GradientText,
  Icon,
  PressButton,
  Skeleton,
  TabaMark,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { UserRole } from '@/core/auth/roles';
import { setOnboardingContext, signIn } from '@/features/auth/use-auth-store';
import { useSelectedLanguage } from '@/lib/i18n';
import { acceptParentInvite, validateParentInvite } from '../services';

export default function ParentInviteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [showPassword, setShowPassword] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(true);
  const [inviteValidation, setInviteValidation] = React.useState<ParentInviteValidateResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm({
    defaultValues: { password: '', fullName: '' },
    onSubmit: async ({ value }) => {
      if (!token) {
        setError(t('auth.invite.invalidToken'));
        return;
      }
      setIsSubmitting(true);
      setError(null);
      try {
        const response = await acceptParentInvite({
          token,
          password: value.password,
          fullName: value.fullName || undefined,
        });

        const authUser = response.user?.email
          ? { id: response.user.id, email: response.user.email, role: response.user.role as UserRole }
          : null;

        signIn({ token: { access: response.accessToken, refresh: response.refreshToken }, user: authUser });

        if (response.onboardingRequired) {
          if (response.user?.email) {
            const onboardingRole
              = response.user.role === UserRole.TEACHER || response.user.role === UserRole.PARENT
                ? (response.user.role as 'TEACHER' | 'PARENT')
                : undefined;
            setOnboardingContext({
              email: response.user.email,
              ...(onboardingRole ? { role: onboardingRole } : {}),
              ...(response.user.fullName ? { fullName: response.user.fullName } : {}),
            });
          }
          router.replace('/onboarding');
        }
        else {
          router.replace('/(tabs)');
        }
      }
      catch (err: unknown) {
        const message = err instanceof Error ? err.message : t('auth.invite.acceptError');
        setError(message || t('auth.invite.acceptError'));
      }
      finally {
        setIsSubmitting(false);
      }
    },
  });

  React.useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        setError(t('auth.invite.invalidToken'));
        setIsValidating(false);
        return;
      }
      try {
        const validation = await validateParentInvite(token);
        setInviteValidation(validation);
        if (!validation.valid) {
          if (validation.expired)
            setError(t('auth.invite.expired'));
          else if (validation.alreadyOnboarded)
            setError(t('auth.invite.alreadyOnboarded'));
          else
            setError(t('auth.invite.invalid'));
        }
      }
      catch (err: unknown) {
        const message = err instanceof Error ? err.message : t('auth.invite.validationError');
        setError(message || t('auth.invite.validationError'));
      }
      finally {
        setIsValidating(false);
      }
    };
    validateInvite();
  }, [t, token]);

  return (
    <ParentInviteView
      {...{
        router,
        t,
        form,
        isValidating,
        inviteValidation,
        isSubmitting,
        error,
        showPassword,
        setShowPassword,
      }}
    />
  );
}

type ParentInviteViewProps = {
  router: ReturnType<typeof useRouter>;
  t: (key: string, opts?: any) => string;
  form: any;
  isValidating: boolean;
  inviteValidation: ParentInviteValidateResponse | null;
  isSubmitting: boolean;
  error: string | null;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
};

// eslint-disable-next-line max-lines-per-function
function ParentInviteView({
  router,
  t,
  form,
  isValidating,
  inviteValidation,
  isSubmitting,
  error,
  showPassword,
  setShowPassword,
}: ParentInviteViewProps) {
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useSelectedLanguage();
  const isRTL = language === 'ar';
  const toggleLanguage = () => setLanguage(language === 'en' ? 'ar' : 'en');

  if (isValidating) {
    return (
      <AuthShell testID="invite-validating-shell">
        <StatusBar style="light" translucent />
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <Skeleton height={64} radius={32} />
          <Skeleton height={20} radius={10} />
        </View>
      </AuthShell>
    );
  }

  if (error && !inviteValidation?.valid) {
    return (
      <AuthShell testID="invite-error-shell">
        <StatusBar style="light" translucent />
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
          }}
        >
          <TabaMark size={72} frame="ink" />
          <Text
            style={{
              color: colors.neutral.white,
              fontSize: 22,
              fontWeight: '700',
              letterSpacing: -0.5,
              textAlign: 'center',
            }}
          >
            {t('auth.invite.errorTitle')}
          </Text>
          <Text
            style={{
              color: colors.neutral.dim,
              fontSize: 14,
              fontWeight: '500',
              lineHeight: 22,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {error}
          </Text>
          <View style={{ alignSelf: 'stretch' }}>
            <PressButton
              variant="gradient"
              size="lg"
              fullWidth
              onPress={() => router.replace('/login')}
              label={t('common.back')}
              trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.white} />}
              testID="invite-back-button"
            />
          </View>
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell testID="invite-auth-shell">
      <StatusBar style="light" translucent />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <TabaMark size={56} frame="ink" />
            <Pressable
              onPress={toggleLanguage}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Icon name="globe" size={14} color={colors.neutral.dim} />
              <Text style={{ color: colors.neutral.dim, fontSize: 13, fontWeight: '700' }}>
                {language === 'en' ? 'العربية' : 'English'}
              </Text>
            </Pressable>
          </View>

          {/* Hero */}
          <View style={{ paddingHorizontal: 24, marginTop: 40 }}>
            <Text
              style={{
                color: colors.neutral.white,
                fontSize: 32,
                lineHeight: 36,
                fontWeight: '700',
                letterSpacing: -1.2,
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              }}
            >
              {t('auth.invite.heroLine1', 'Join your')}
            </Text>
            <View style={{ marginTop: 2, alignSelf: isRTL ? 'flex-end' : 'flex-start' }}>
              <GradientText size={32} weight="700">
                {t('auth.invite.heroLine2', 'classroom.')}
              </GradientText>
            </View>
            <Text
              style={{
                color: colors.neutral.dim,
                fontSize: 14,
                lineHeight: 22,
                fontWeight: '500',
                marginTop: 12,
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              }}
            >
              {t('auth.invite.subtitle')}
            </Text>
          </View>

          {/* Body */}
          <View style={{ paddingHorizontal: 24, marginTop: 22, flex: 1 }}>
            <View style={{ gap: 14 }}>
              {error
                ? (
                    <Text
                      style={{
                        color: colors.semantic.absent,
                        fontSize: 13,
                        fontWeight: '600',
                        textAlign: 'center',
                      }}
                    >
                      {error}
                    </Text>
                  )
                : null}

              <form.Field
                name="fullName"
                children={(field: any) => (
                  <AuthFieldShell>
                    <AuthInput
                      value={field.state.value}
                      onChangeText={field.handleChange}
                      placeholder={t('auth.invite.fullNameLabel')}
                      autoCapitalize="words"
                      testID="fullname-input"
                      textAlign={isRTL ? 'right' : 'left'}
                      fontSize={16}
                      letterSpacing={0}
                    />
                  </AuthFieldShell>
                )}
              />

              <form.Field
                name="password"
                children={(field: any) => (
                  <AuthFieldShell>
                    <AuthInput
                      value={field.state.value}
                      onChangeText={field.handleChange}
                      placeholder={t('auth.invite.passwordLabel')}
                      secureTextEntry={!showPassword}
                      testID="password-input"
                      textAlign={isRTL ? 'right' : 'left'}
                      fontSize={16}
                      letterSpacing={0}
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={{ marginStart: 8 }}
                    >
                      <Icon
                        name={showPassword ? 'eyeOff' : 'eye'}
                        size={20}
                        color={colors.neutral.dim}
                      />
                    </Pressable>
                  </AuthFieldShell>
                )}
              />

              <form.Subscribe
                selector={(state: any) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, validating]: [boolean, boolean]) => (
                  <PressButton
                    variant="gradient"
                    size="lg"
                    fullWidth
                    loading={isSubmitting || validating}
                    disabled={!canSubmit}
                    onPress={() => void form.handleSubmit()}
                    label={t('auth.invite.acceptButton')}
                    trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.white} />}
                    testID="invite-submit-button"
                  />
                )}
              />
            </View>

            {/* Spacer */}
            <View style={{ flex: 1, minHeight: 16 }} />

            <Text
              style={{
                color: colors.neutral.inkMuted,
                fontSize: 11,
                lineHeight: 16,
                fontWeight: '500',
                textAlign: 'center',
                marginTop: 16,
                marginBottom: Math.max(insets.bottom, 12),
              }}
            >
              {t('auth.login.legalLine', 'By continuing you agree to Taba3ny\'s Terms and Privacy Policy.')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthShell>
  );
}
