import type { useRouter } from 'expo-router';
import type { TFunction } from 'i18next';
import type {
  PhoneSignupParams,
  PhoneSignupVerifyParams,
  PhoneSignupVerifyResponse,
  SignupPayload,
} from '../types';
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
import { AuthShell, Icon, LegalNote } from '@/components/ui';
import colors from '@/components/ui/colors';
import { AppRoute } from '@/core/navigation/routes';
import { useSelectedLanguage } from '@/lib/i18n';
import { AuthHero } from '../components/auth-hero';
import { AuthTopBar } from '../components/auth-top-bar';
import { PhoneSignupForm } from '../components/phone-signup-form';
import { SignupForm } from '../components/signup-form';

type SignupRole = 'TEACHER' | 'PARENT' | 'MANAGER';
type OtpPurpose = 'SIGNUP' | 'RESET_PASSWORD';

export type SignupScreenViewProps = {
  router: ReturnType<typeof useRouter>;
  t: TFunction;
  signupMode: 'email' | 'phone';
  setSignupMode: (mode: 'email' | 'phone') => void;
  handleSubmit: (values: SignupPayload) => Promise<void>;
  handlePhoneSignup: (values: PhoneSignupParams) => Promise<void>;
  handlePhoneOtpRequest: (phone: string, purpose: OtpPurpose) => Promise<void>;
  handlePhoneOtpVerify: (values: PhoneSignupVerifyParams) => Promise<PhoneSignupVerifyResponse>;
  handleGoogleSignup: (idToken: string, role: SignupRole) => Promise<void>;
  handleGoogleSignupError: (error: Error) => void;
  isPending: boolean;
  isPhoneSignupPending: boolean;
  isOtpPending: boolean;
  isPhoneSignupVerifyPending: boolean;
  isGoogleSigningIn: boolean;
  isGoogleSigninMobileEnabled: boolean;
  errorMsg: string | null;
  pendingGoogleToken: unknown;
  prefillEmailParam: string;
};

// eslint-disable-next-line max-lines-per-function
export function SignupScreenView({
  router,
  t,
  signupMode,
  setSignupMode,
  handleSubmit,
  handlePhoneSignup,
  handlePhoneOtpRequest,
  handlePhoneOtpVerify,
  handleGoogleSignup,
  handleGoogleSignupError,
  isPending,
  isPhoneSignupPending,
  isOtpPending,
  isPhoneSignupVerifyPending,
  isGoogleSigningIn,
  isGoogleSigninMobileEnabled,
  errorMsg,
  pendingGoogleToken,
  prefillEmailParam,
}: SignupScreenViewProps) {
  const insets = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const { language } = useSelectedLanguage();
  const isRTL = i18n.language === 'ar' || language === 'ar';

  return (
    <AuthShell testID="signup-auth-shell">
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
          <AuthTopBar onBack={() => router.back()} backTestID="back-button" markTestID="signup-mark" />

          <AuthHero
            line1={t('auth.signup.heroLine1', 'Create your')}
            line2={t('auth.signup.heroLine2', 'classroom.')}
            subtitle={t('auth.signup.subheadline', 'Sign up to start tracking sessions, attendance, and progress.')}
            isRTL={isRTL}
          />

          <View style={{ paddingHorizontal: 24, marginTop: 22, flex: 1 }}>
            {signupMode === 'email'
              ? (
                  <SignupForm
                    key={prefillEmailParam || 'signup-default'}
                    onSubmit={handleSubmit}
                    isSubmitting={isPending}
                    error={errorMsg}
                    onGoogleSignUp={handleGoogleSignup}
                    onGoogleSignInError={handleGoogleSignupError}
                    isGoogleSigningIn={isGoogleSigningIn}
                    showGoogleSignIn={isGoogleSigninMobileEnabled}
                    initialEmail={prefillEmailParam}
                    useExistingGoogleToken={Boolean(pendingGoogleToken)}
                  />
                )
              : (
                  <PhoneSignupForm
                    onSubmit={handlePhoneSignup}
                    onOtpRequest={handlePhoneOtpRequest}
                    onOtpVerify={handlePhoneOtpVerify}
                    isSubmitting={isPhoneSignupPending}
                    isRequestingOtp={isOtpPending}
                    isVerifyingOtp={isPhoneSignupVerifyPending}
                    error={errorMsg}
                  />
                )}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginVertical: 18,
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
              onPress={() => setSignupMode(signupMode === 'email' ? 'phone' : 'email')}
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
              testID="signup-mode-toggle"
            >
              <Icon
                name={signupMode === 'email' ? 'phonePortrait' : 'mail'}
                size={18}
                color={colors.neutral.white}
              />
              <Text style={{ color: colors.neutral.white, fontSize: 14, fontWeight: '600' }}>
                {signupMode === 'email'
                  ? t('auth.login.usePhoneInstead', 'Use phone instead')
                  : t('auth.login.useEmailInstead', 'Use email instead')}
              </Text>
            </Pressable>

            <View style={{ flex: 1, minHeight: 16 }} />

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
                {t('auth.signup.alreadyHaveAccount')}
              </Text>
              <Pressable onPress={() => router.replace(AppRoute.auth.login)} testID="login-link">
                <Text style={{ color: colors.brand.primary, fontSize: 14, fontWeight: '700' }}>
                  {t('auth.signup.loginLink')}
                </Text>
              </Pressable>
            </View>

            <LegalNote
              marginTop={14}
              marginBottom={Math.max(insets.bottom, 12)}
              paddingHorizontal={8}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthShell>
  );
}
