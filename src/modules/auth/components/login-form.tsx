import type { LoginFormValues } from '../types';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  Pressable,
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
  isoToFlagEmoji,
  PressButton,
  TabaMark,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { Modal, useModal } from '@/components/ui/modal';
import { AppRoute } from '@/core/navigation/routes';
import { useSelectedLanguage } from '@/lib/i18n';
import {
  buildE164Phone,
  DEFAULT_COUNTRY_CODE,
  getPhoneCountryByDialCode,
  getSupportedPhoneCountries,
  splitE164Phone,
} from '@/shared/utils/phone';
import { loginSchema } from '../validators';
import { GoogleSignInButton } from './google-sign-in-button';

/**
 * LoginForm — Phase 6 rebuild against `contracts/visual-auth.md`.
 *
 * Shell: dark `<AuthShell>` (single full-bleed surface, brand glows).
 * Hero: corner `<TabaMark>`, two-line headline, second line is `<GradientText>`.
 * Primary path: phone number → password → gradient CTA. Email is reachable
 * via "Use email instead" link beneath the OR divider.
 *
 * Behavior preserved verbatim from the previous form: same `onSubmit`,
 * `onPhoneSubmit`, Google sign-in, forgot password, signup link, error
 * surfacing, RTL direction. The visual contract is the only change.
 */

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

function getValidationError(
  t: (key: string) => string,
  fieldErrors: unknown[],
): string | undefined {
  const firstError = fieldErrors[0];
  if (!firstError)
    return undefined;
  if (typeof firstError === 'string')
    return t(firstError);
  if (
    typeof firstError === 'object'
    && firstError !== null
    && 'message' in firstError
    && typeof (firstError as { message: unknown }).message === 'string'
  ) {
    return t((firstError as { message: string }).message);
  }
  return t('auth.login.genericError');
}

// ── Main form ────────────────────────────────────────────────────────────

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
  initialMode = 'phone',
  initialPhone = '',
}: LoginFormProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useSelectedLanguage();
  const isRTL = i18n.language === 'ar' || language === 'ar';

  const [showPassword, setShowPassword] = useState(false);
  const [showPhonePassword, setShowPhonePassword] = useState(false);
  const [loginMode, setLoginMode] = useState<'email' | 'phone'>(initialMode);

  const initialPhoneParts = React.useMemo(
    () => splitE164Phone(initialPhone),
    [initialPhone],
  );
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    initialPhoneParts.countryCode || DEFAULT_COUNTRY_CODE,
  );
  const [phoneLocalNumber, setPhoneLocalNumber] = useState(
    initialPhoneParts.localNumber,
  );
  const [phonePassword, setPhonePassword] = useState('');
  const countryPickerModal = useModal();

  const phoneCountry = getPhoneCountryByDialCode(phoneCountryCode);
  const composedPhone = buildE164Phone(phoneCountryCode, phoneLocalNumber);
  const phoneFlag = isoToFlagEmoji(phoneCountry.iso2);
  const supportedCountries = React.useMemo(
    () => getSupportedPhoneCountries(),
    [],
  );

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onChange: loginSchema as never },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const handlePhoneContinue = () => {
    if (!composedPhone || !phonePassword)
      return;
    onPhoneSubmit?.({ phone: composedPhone, password: phonePassword });
  };

  const phoneCanContinue = !!composedPhone && phonePassword.length >= 6;

  return (
    <AuthShell testID="auth-shell">
      {/* Top bar — corner mark + language switch */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TabaMark size={56} frame="ink" testID="auth-mark" />
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

      {/* Hero copy */}
      <View style={{ paddingHorizontal: 24, marginTop: 56 }}>
        <Text
          style={{
            color: colors.neutral.white,
            fontSize: 34,
            lineHeight: 38,
            fontWeight: '700',
            letterSpacing: -1.2,
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
          }}
        >
          {t('auth.login.heroLine1', 'The classroom,')}
        </Text>
        <View style={{ marginTop: 2, alignSelf: isRTL ? 'flex-end' : 'flex-start' }}>
          <GradientText size={34} weight="700">
            {t('auth.login.heroLine2', 'on your phone.')}
          </GradientText>
        </View>
        <Text
          style={{
            color: colors.neutral.dim,
            fontSize: 14,
            lineHeight: 22,
            fontWeight: '500',
            marginTop: 14,
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
          }}
        >
          {t(
            'auth.login.subheadline',
            'Sign in to track sessions, attendance, and progress.',
          )}
        </Text>
      </View>

      {/* Body — phone OR email */}
      <View style={{ paddingHorizontal: 24, marginTop: 24, flex: 1 }}>
        {error
          ? (
              <Text
                style={{
                  color: colors.semantic.absent,
                  fontSize: 13,
                  fontWeight: '600',
                  marginBottom: 10,
                  textAlign: 'center',
                }}
              >
                {error}
              </Text>
            )
          : null}

        {loginMode === 'phone'
          ? (
              <View style={{ gap: 12 }}>
                {/* Country chip + phone */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => {
                      console.log('[login-form] country chip pressed');
                      countryPickerModal.present();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t('auth.phone.countryCodeLabel', 'Country')}
                    testID="login-country-chip"
                    style={({ pressed }) => ({
                      height: 56,
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      backgroundColor: pressed
                        ? 'rgba(34,197,114,0.30)'
                        : 'rgba(255,255,255,0.06)',
                      borderWidth: 1.5,
                      borderColor: pressed
                        ? colors.brand.primary
                        : 'rgba(255,255,255,0.12)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    })}
                  >
                    <Text style={{ fontSize: 18 }}>{phoneFlag}</Text>
                    <Text
                      style={{
                        color: colors.neutral.white,
                        fontSize: 15,
                        fontWeight: '700',
                      }}
                    >
                      {phoneCountryCode}
                    </Text>
                    <Text style={{ color: colors.neutral.dim, fontSize: 14, marginStart: 2 }}>
                      ▾
                    </Text>
                  </Pressable>
                  <AuthFieldShell>
                    <AuthInput
                      value={phoneLocalNumber}
                      onChangeText={setPhoneLocalNumber}
                      placeholder={t('auth.phone.localPlaceholder', '1XX XXX XXXX')}
                      keyboardType="phone-pad"
                      testID="login-phone-input"
                      textAlign={isRTL ? 'right' : 'left'}
                    />
                  </AuthFieldShell>
                </View>

                {/* Password */}
                <AuthFieldShell>
                  <AuthInput
                    value={phonePassword}
                    onChangeText={setPhonePassword}
                    placeholder={t('auth.phone.passwordLabel', 'Password')}
                    secureTextEntry={!showPhonePassword}
                    testID="phone-password-input"
                    textAlign={isRTL ? 'right' : 'left'}
                    fontSize={16}
                    letterSpacing={0}
                  />
                  <Pressable
                    onPress={() => setShowPhonePassword(s => !s)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ marginStart: 8 }}
                  >
                    <Icon
                      name={showPhonePassword ? 'eyeOff' : 'eye'}
                      size={20}
                      color={colors.neutral.dim}
                    />
                  </Pressable>
                </AuthFieldShell>

                <Pressable
                  onPress={onForgotPhonePassword}
                  disabled={!onForgotPhonePassword}
                  style={{ alignSelf: isRTL ? 'flex-start' : 'flex-end', paddingVertical: 4 }}
                >
                  <Text style={{ color: colors.neutral.dim, fontSize: 13, fontWeight: '600' }}>
                    {t('auth.login.forgotPassword')}
                  </Text>
                </Pressable>

                <PressButton
                  variant="gradient"
                  size="lg"
                  fullWidth
                  loading={isPhoneSubmitting}
                  disabled={!phoneCanContinue}
                  onPress={handlePhoneContinue}
                  label={t('auth.login.submit', 'Continue')}
                  trailingIcon={(
                    <Icon
                      name="arrowR"
                      size={18}
                      color={colors.neutral.white}
                    />
                  )}
                  testID="phone-login-submit-button"
                />
              </View>
            )
          : (
              <View style={{ gap: 12 }}>
                <form.Field
                  name="email"
                  children={(field) => {
                    const hasError = field.state.meta.errors.length > 0;
                    const fieldErrorMsg = getValidationError(t, field.state.meta.errors);
                    return (
                      <View>
                        <AuthFieldShell hasError={hasError}>
                          <AuthInput
                            value={field.state.value}
                            onChangeText={field.handleChange}
                            placeholder={t('auth.login.emailLabel', 'Email')}
                            keyboardType="email-address"
                            testID="email-input"
                            textAlign={isRTL ? 'right' : 'left'}
                            fontSize={16}
                            letterSpacing={0}
                          />
                        </AuthFieldShell>
                        {hasError && fieldErrorMsg
                          ? (
                              <Text
                                style={{
                                  color: colors.semantic.absent,
                                  fontSize: 12,
                                  marginTop: 6,
                                  marginStart: 4,
                                }}
                              >
                                {fieldErrorMsg}
                              </Text>
                            )
                          : null}
                      </View>
                    );
                  }}
                />

                <form.Field
                  name="password"
                  children={(field) => {
                    const hasError = field.state.meta.errors.length > 0;
                    const fieldErrorMsg = getValidationError(t, field.state.meta.errors);
                    return (
                      <View>
                        <AuthFieldShell hasError={hasError}>
                          <AuthInput
                            value={field.state.value}
                            onChangeText={field.handleChange}
                            placeholder={t('auth.login.passwordLabel', 'Password')}
                            secureTextEntry={!showPassword}
                            testID="password-input"
                            textAlign={isRTL ? 'right' : 'left'}
                            fontSize={16}
                            letterSpacing={0}
                          />
                          <Pressable
                            onPress={() => setShowPassword(s => !s)}
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
                        {hasError && fieldErrorMsg
                          ? (
                              <Text
                                style={{
                                  color: colors.semantic.absent,
                                  fontSize: 12,
                                  marginTop: 6,
                                  marginStart: 4,
                                }}
                              >
                                {fieldErrorMsg}
                              </Text>
                            )
                          : null}
                      </View>
                    );
                  }}
                />

                <Pressable
                  onPress={() => onForgotPassword?.(form.state.values.email?.trim() ?? '')}
                  style={{ alignSelf: isRTL ? 'flex-start' : 'flex-end', paddingVertical: 4 }}
                >
                  <Text style={{ color: colors.neutral.dim, fontSize: 13, fontWeight: '600' }}>
                    {t('auth.login.forgotPassword')}
                  </Text>
                </Pressable>

                <form.Subscribe
                  selector={state => [state.canSubmit, state.isSubmitting]}
                  children={([canSubmit, validating]) => (
                    <PressButton
                      variant="gradient"
                      size="lg"
                      fullWidth
                      loading={isSubmitting || (validating as boolean)}
                      disabled={!canSubmit}
                      onPress={() => void form.handleSubmit()}
                      label={t('auth.login.submit', 'Continue')}
                      trailingIcon={(
                        <Icon
                          name="arrowR"
                          size={18}
                          color={colors.neutral.white}
                        />
                      )}
                      testID="login-submit-button"
                    />
                  )}
                />
              </View>
            )}

        {/* OR divider */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginVertical: 20,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' }} />
          <Text
            style={{
              color: colors.neutral.inkMuted,
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 1.5,
            }}
          >
            {t('auth.login.orDivider', 'OR')}
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' }} />
        </View>

        {/* Mode toggle (text link, not SegTabs) */}
        <Pressable
          onPress={() => setLoginMode(loginMode === 'phone' ? 'email' : 'phone')}
          style={{
            height: 50,
            borderRadius: 14,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 10,
          }}
        >
          <Icon
            name={loginMode === 'phone' ? 'mail' : 'phonePortrait'}
            size={18}
            color={colors.neutral.white}
          />
          <Text style={{ color: colors.neutral.white, fontSize: 14, fontWeight: '600' }}>
            {loginMode === 'phone'
              ? t('auth.login.useEmailInstead', 'Use email instead')
              : t('auth.login.usePhoneInstead', 'Use phone instead')}
          </Text>
        </Pressable>

        {/* Google */}
        {showGoogleSignIn
          ? (
              <View style={{ marginTop: 10 }}>
                <GoogleSignInButton
                  onSuccess={idToken => onGoogleSignIn?.(idToken)}
                  onError={googleError => onGoogleSignInError?.(googleError)}
                  isLoading={isGoogleSigningIn}
                  variant="login"
                />
              </View>
            )
          : null}

        {/* Spacer to push footer to bottom */}
        <View style={{ flex: 1 }} />

        {/* Create account + legal */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 24,
          }}
        >
          <Text style={{ color: colors.neutral.dim, fontSize: 14, fontWeight: '500' }}>
            {t('auth.login.dontHaveAccount')}
          </Text>
          <Pressable onPress={() => router.push(AppRoute.auth.signup)}>
            <Text style={{ color: colors.brand.primary, fontSize: 14, fontWeight: '700' }}>
              {t('auth.login.createAccount')}
            </Text>
          </Pressable>
        </View>

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

        {Platform.OS === 'ios' ? null : <View style={{ height: 8 }} />}
      </View>

      {/* Country picker — same Modal/useModal pattern proven by PhoneField. */}
      <Modal
        ref={countryPickerModal.ref}
        snapPoints={['38%']}
        title={t('auth.phone.countryCodeLabel', 'Country')}
      >
        <View style={{ paddingHorizontal: 20, paddingBottom: 22, gap: 8 }}>
          {supportedCountries.map((country) => {
            const selected = country.dialCode === phoneCountryCode;
            const flag = isoToFlagEmoji(country.iso2);
            const label = t(`auth.phone.countries.${country.iso2.toLowerCase()}`, {
              dialCode: country.dialCode,
              defaultValue: `${country.iso2} (${country.dialCode})`,
            });
            return (
              <Pressable
                key={country.iso2}
                onPress={() => {
                  setPhoneCountryCode(country.dialCode);
                  countryPickerModal.dismiss();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                testID={`country-option-${country.iso2.toLowerCase()}`}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: selected
                    ? colors.brand.primaryGlow
                    : pressed
                      ? colors.neutral.paper
                      : 'transparent',
                })}
              >
                <Text style={{ fontSize: 24 }}>{flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.neutral.ink,
                      fontSize: 15,
                      fontWeight: '700',
                    }}
                  >
                    {label}
                  </Text>
                  <Text
                    style={{
                      color: colors.neutral.inkMuted,
                      fontSize: 13,
                      fontWeight: '500',
                      marginTop: 2,
                    }}
                  >
                    {country.dialCode}
                  </Text>
                </View>
                {selected
                  ? <Icon name="check" size={20} color={colors.brand.primary} />
                  : null}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </AuthShell>
  );
}
