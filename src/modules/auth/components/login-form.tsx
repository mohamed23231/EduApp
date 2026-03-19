import type { LoginFormValues } from '@modules/auth/types';
import { GoogleSignInButton } from '@modules/auth/components/google-sign-in-button';
import {
  AuthButton,
  AuthInput,
  DividerWithText,
  SegmentedControl,
} from '@modules/auth/components/ui';
import { loginSchema } from '@modules/auth/validators';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  Text,
  View,
} from 'react-native';
import { PhoneField } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import { useSelectedLanguage } from '@/lib/i18n';
import {
  buildE164Phone,
  DEFAULT_COUNTRY_CODE,
  splitE164Phone,
} from '@/shared/utils/phone';

export type LoginFormProps = {
  onSubmit: (data: LoginFormValues) => void;
  onPhoneSubmit?: (data: { phone: string; password: string }) => void;
  isSubmitting: boolean;
  isPhoneSubmitting?: boolean;
  error?: string | null;
  onForgotPassword?: (email: string) => void;
  onForgotPhonePassword?: () => void;
  onGoogleSignIn?: (idToken: string) => void;
  onGoogleSignInError?: (error: Error) => void;
  isGoogleSigningIn?: boolean;
  showGoogleSignIn?: boolean;
  initialMode?: 'email' | 'phone';
  initialPhone?: string;
};

// eslint-disable-next-line max-lines-per-function
export function LoginForm({
  onSubmit,
  onPhoneSubmit,
  isSubmitting,
  isPhoneSubmitting = false,
  error,
  onForgotPassword,
  onForgotPhonePassword,
  onGoogleSignIn,
  onGoogleSignInError,
  isGoogleSigningIn = false,
  showGoogleSignIn = false,
  initialMode = 'email',
  initialPhone = '',
}: LoginFormProps) {
  const { t, i18n } = useTranslation();
  const initialPhoneParts = React.useMemo(() => splitE164Phone(initialPhone), [initialPhone]);
  const [loginMode, setLoginMode] = React.useState<'email' | 'phone'>(initialMode);
  const [phoneCountryCode, setPhoneCountryCode] = React.useState(
    initialPhoneParts.countryCode || DEFAULT_COUNTRY_CODE,
  );
  const [phoneLocalNumber, setPhoneLocalNumber] = React.useState(
    initialPhoneParts.localNumber,
  );
  const [phonePassword, setPhonePassword] = React.useState('');
  const { language, setLanguage } = useSelectedLanguage();
  const router = useRouter();
  const isRTL = i18n.language === 'ar' || language === 'ar';

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
  };

  const getValidationError = (fieldErrors: unknown[]) => {
    const firstError = fieldErrors[0];

    if (!firstError) {
      return undefined;
    }

    if (typeof firstError === 'string') {
      return t(firstError);
    }

    if (
      typeof firstError === 'object'
      && firstError !== null
      && 'message' in firstError
      && typeof firstError.message === 'string'
    ) {
      return t(firstError.message);
    }

    return t('auth.login.genericError');
  };

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: loginSchema as any,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });
  const composedPhone = buildE164Phone(phoneCountryCode, phoneLocalNumber);

  return (
    <View>
      {/* Email / Phone tab toggle */}
      <SegmentedControl
        segments={[t('auth.login.emailTab'), t('auth.login.phoneTab')]}
        activeIndex={loginMode === 'email' ? 0 : 1}
        onChange={i => setLoginMode(i === 0 ? 'email' : 'phone')}
      />

      {error
        ? (
            <View className="my-4 flex-row items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <Text className="flex-1 text-sm text-red-600">{error}</Text>
            </View>
          )
        : null}

      {loginMode === 'email'
        ? (
            /* ── Email form ── */
            <View className="mt-5 gap-3.5">
              <form.Field
                name="email"
                children={(field) => {
                  const fieldErrorMsg = getValidationError(field.state.meta.errors);
                  return (
                    <AuthInput
                      label={t('auth.login.emailLabel')}
                      value={field.state.value}
                      onChangeText={field.handleChange}
                      onBlur={field.handleBlur}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                      placeholder="name@school.edu"
                      textAlign={isRTL ? 'right' : 'left'}
                      error={fieldErrorMsg}
                      testID="email-input"
                    />
                  );
                }}
              />

              <form.Field
                name="password"
                children={(field) => {
                  const fieldErrorMsg = getValidationError(field.state.meta.errors);
                  return (
                    <View className="gap-1.5">
                      <AuthInput
                        isPassword
                        label={t('auth.login.passwordLabel')}
                        value={field.state.value}
                        onChangeText={field.handleChange}
                        onBlur={field.handleBlur}
                        autoCorrect={false}
                        textAlign={isRTL ? 'right' : 'left'}
                        error={fieldErrorMsg}
                        testID="password-input"
                      />
                      <Pressable
                        className="self-end"
                        onPress={() => onForgotPassword?.(form.state.values.email?.trim() ?? '')}
                      >
                        <Text className="text-[13px] font-semibold text-blue-500">
                          {t('auth.login.forgotPassword')}
                        </Text>
                      </Pressable>
                    </View>
                  );
                }}
              />

              <form.Subscribe
                selector={state => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, validating]) => (
                  <AuthButton
                    variant="black"
                    title={t('auth.login.submit')}
                    onPress={() => void form.handleSubmit()}
                    disabled={!canSubmit || isSubmitting || (validating as boolean)}
                    loading={isSubmitting || (validating as boolean)}
                  />
                )}
              />
            </View>
          )
        : (
            /* ── Phone form ── */
            <View className="mt-5 gap-3.5">
              <PhoneField
                label={t('auth.phone.phoneLabel')}
                countryCode={phoneCountryCode}
                localNumber={phoneLocalNumber}
                onCountryCodeChange={setPhoneCountryCode}
                onLocalNumberChange={setPhoneLocalNumber}
                localPlaceholder="5XXXXXXXX"
                testIDPrefix="login-phone"
              />

              <View className="gap-1.5">
                <AuthInput
                  isPassword
                  label={t('auth.phone.passwordLabel')}
                  value={phonePassword}
                  onChangeText={setPhonePassword}
                  autoCorrect={false}
                  testID="phone-password-input"
                />
                <Pressable
                  className="self-end"
                  onPress={onForgotPhonePassword}
                  disabled={!onForgotPhonePassword}
                >
                  <Text className="text-[13px] font-semibold text-blue-500">
                    {t('auth.login.forgotPassword')}
                  </Text>
                </Pressable>
              </View>

              <AuthButton
                variant="black"
                title={t('auth.phone.loginButton')}
                onPress={() => {
                  if (!composedPhone)
                    return;
                  onPhoneSubmit?.({ phone: composedPhone, password: phonePassword });
                }}
                disabled={isPhoneSubmitting || !composedPhone || !phonePassword}
                loading={isPhoneSubmitting}
              />
            </View>
          )}

      {showGoogleSignIn
        ? (
            <>
              <DividerWithText text={t('auth.login.orConnectWith')} />
              <GoogleSignInButton
                onSuccess={(idToken) => {
                  onGoogleSignIn?.(idToken);
                }}
                onError={(googleError) => {
                  onGoogleSignInError?.(googleError);
                }}
                isLoading={isGoogleSigningIn}
                variant="login"
              />
            </>
          )
        : null}

      <View className="mt-5 flex-row justify-center">
        <Text className="text-sm text-gray-500">
          {t('auth.login.dontHaveAccount')}
          {' '}
        </Text>
        <Pressable onPress={() => router.push(AppRoute.auth.signup)}>
          <Text className="text-sm font-semibold text-blue-500">
            {t('auth.login.createAccount')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
