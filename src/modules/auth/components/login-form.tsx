import type { LoginFormValues } from '../types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AuthShell,
  GradientText,
  Icon,
  LegalNote,
  TabaMark,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { useModal } from '@/components/ui/modal';
import { AppRoute } from '@/core/navigation/routes';
import { useSelectedLanguage } from '@/lib/i18n';
import {
  buildE164Phone,
  DEFAULT_COUNTRY_CODE,
  splitE164Phone,
} from '@/shared/utils/phone';
import { FormErrorText } from './auth-error-text';
import { GoogleSignInButton } from './google-sign-in-button';
import { EmailLoginFields } from './login/email-login-fields';
import { PhoneLoginFields } from './login/phone-login-fields';
import { CountryPickerSheet } from './phone/country-picker-sheet';

/**
 * LoginForm — Phase 6 rebuild against `contracts/visual-auth.md` (reconciled to
 * the password-login model). Dark `<AuthShell>`, corner `<TabaMark>`, gradient
 * hero second line, gradient CTA. Phone + password is the primary path; email
 * login is reachable via the toggle link. NO OTP-as-login, NO WhatsApp login.
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

  const [loginMode, setLoginMode] = useState<'email' | 'phone'>(initialMode);

  const initialPhoneParts = React.useMemo(() => splitE164Phone(initialPhone), [initialPhone]);
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    initialPhoneParts.countryCode || DEFAULT_COUNTRY_CODE,
  );
  const [phoneLocalNumber, setPhoneLocalNumber] = useState(initialPhoneParts.localNumber);
  const [phonePassword, setPhonePassword] = useState('');
  const countryPickerModal = useModal();

  const composedPhone = buildE164Phone(phoneCountryCode, phoneLocalNumber);
  const phoneCanContinue = !!composedPhone && phonePassword.length >= 6;

  const toggleLanguage = () => setLanguage(language === 'en' ? 'ar' : 'en');

  const handlePhoneContinue = () => {
    if (!composedPhone || !phonePassword)
      return;
    onPhoneSubmit?.({ phone: composedPhone, password: phonePassword });
  };

  return (
    <AuthShell testID="auth-shell">
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
          {t('auth.login.subheadline', 'Sign in to track sessions, attendance, and progress.')}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24, marginTop: 24, flex: 1 }}>
        <FormErrorText message={error} style={{ marginBottom: 10 }} />

        {loginMode === 'phone'
          ? (
              <PhoneLoginFields
                isRTL={isRTL}
                isSubmitting={isPhoneSubmitting}
                dialCode={phoneCountryCode}
                localNumber={phoneLocalNumber}
                password={phonePassword}
                canContinue={phoneCanContinue}
                onOpenCountryPicker={() => countryPickerModal.present()}
                onLocalNumberChange={setPhoneLocalNumber}
                onPasswordChange={setPhonePassword}
                onForgotPassword={() => onForgotPhonePassword?.()}
                onContinue={handlePhoneContinue}
              />
            )
          : (
              <EmailLoginFields
                isRTL={isRTL}
                isSubmitting={isSubmitting}
                onSubmit={onSubmit}
                onForgotPassword={email => onForgotPassword?.(email)}
              />
            )}

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

        <View style={{ flex: 1 }} />

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

        <LegalNote marginTop={16} marginBottom={Math.max(insets.bottom, 12)} />

        {Platform.OS === 'ios' ? null : <View style={{ height: 8 }} />}
      </View>

      <CountryPickerSheet
        modalRef={countryPickerModal.ref}
        selectedDialCode={phoneCountryCode}
        onSelect={(dialCode) => {
          setPhoneCountryCode(dialCode);
          countryPickerModal.dismiss();
        }}
        testIDPrefix="country"
      />
    </AuthShell>
  );
}
