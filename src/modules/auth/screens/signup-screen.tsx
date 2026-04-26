import type { SignupPayload } from '../types';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AuthShell,
  GradientText,
  Icon,
  TabaMark,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { UserRole } from '@/core/auth/roles';
import { getHomeRouteForRole } from '@/core/auth/routing';
import { useFeatureFlags } from '@/core/feature-flags/use-feature-flags';
import { AppRoute } from '@/core/navigation/routes';
import { setOnboardingContext, signIn, useAuthStore } from '@/features/auth/use-auth-store';
import {
  createTokenWithTimestamp,
  isTokenWithinReuseWindow,
} from '@/lib/auth/token-reuse-window';
import { useSelectedLanguage } from '@/lib/i18n';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import { PhoneSignupForm } from '../components/phone-signup-form';
import { SignupForm } from '../components/signup-form';
import {
  usePhoneOtpRequest,
  usePhoneSignup,
  usePhoneSignupVerify,
} from '../hooks/use-phone-signup';
import { useSignup } from '../hooks/use-signup';
import { googleAuthService } from '../services';

type SignupRole = 'TEACHER' | 'PARENT' | 'MANAGER';

function getSignupRole(role: UserRole | string | undefined): SignupRole | undefined {
  if (role === UserRole.TEACHER || role === UserRole.PARENT || role === UserRole.MANAGER) {
    return role;
  }

  return undefined;
}

// eslint-disable-next-line max-lines-per-function
export function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    prefillEmail?: string | string[];
    idToken?: string | string[];
  }>();
  const { t } = useTranslation();
  const status = useAuthStore.use.status();
  const user = useAuthStore.use.user();
  const onboardingContext = useAuthStore.use.onboardingContext();
  const { mutateAsync: signup, isPending } = useSignup();
  const { mutateAsync: phoneSignupMutate, isPending: isPhoneSignupPending } = usePhoneSignup();
  const { mutateAsync: requestOtp, isPending: isOtpPending } = usePhoneOtpRequest();
  const {
    mutateAsync: verifyPhoneSignup,
    isPending: isPhoneSignupVerifyPending,
  } = usePhoneSignupVerify();
  const { isGoogleSigninMobileEnabled } = useFeatureFlags();
  const [signupMode, setSignupMode] = useState<'email' | 'phone'>('email');
  const prefillEmailParam = Array.isArray(params.prefillEmail)
    ? (params.prefillEmail[0] ?? '')
    : (params.prefillEmail ?? '');
  const idTokenParam = Array.isArray(params.idToken)
    ? (params.idToken[0] ?? '')
    : (params.idToken ?? '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [pendingGoogleToken, setPendingGoogleToken] = useState<
    ReturnType<typeof createTokenWithTimestamp> | null
  >(() => (idTokenParam ? createTokenWithTimestamp(idTokenParam) : null));

  // Redirect if already authenticated
  if (status === 'signIn' && !user) {
    if (onboardingContext?.role === UserRole.MANAGER) {
      return <Redirect href={AppRoute.manager.setup} />;
    }
    return <Redirect href={AppRoute.auth.onboarding} />;
  }

  if (status === 'signIn' && user) {
    return <Redirect href={getHomeRouteForRole(user.role)} />;
  }

  const handleSubmit = async (values: SignupPayload) => {
    setErrorMsg(null);
    try {
      const data = await signup(values);
      const signupRole = getSignupRole(data.user.role as UserRole);

      if (signupRole === UserRole.MANAGER) {
        setOnboardingContext({ role: signupRole, email: data.user.email, fullName: data.user.fullName });
        signIn({ token: { access: data.accessToken, refresh: data.refreshToken }, user: null });
        router.replace(AppRoute.manager.setup);
        return;
      }

      setOnboardingContext({ role: signupRole, email: data.user.email, fullName: data.user.fullName });
      signIn({ token: { access: data.accessToken, refresh: data.refreshToken }, user: null });
      router.replace(AppRoute.auth.onboarding);
    }
    catch (error) {
      const msg = getApiErrorMessage(error, t('auth.signup.genericError'));
      setErrorMsg(msg);
    }
  };

  const handlePhoneSignup = async (values: Parameters<typeof phoneSignupMutate>[0]) => {
    setErrorMsg(null);
    try {
      const data = await phoneSignupMutate(values);
      const signupRole = getSignupRole(data.user?.role);

      if (signupRole === UserRole.MANAGER) {
        setOnboardingContext({
          role: signupRole,
          email: data.user?.email ?? '',
          fullName: data.user?.fullName ?? data.fullName,
          phone: data.user?.phoneE164 ?? data.phoneE164 ?? undefined,
        });
        signIn({ token: { access: data.accessToken, refresh: data.refreshToken }, user: null });
        router.replace(AppRoute.manager.setup);
        return;
      }

      setOnboardingContext({
        role: signupRole ?? 'PARENT',
        email: data.user?.email ?? '',
        fullName: data.user?.fullName ?? data.fullName,
        phone: data.user?.phoneE164 ?? data.phoneE164 ?? undefined,
      });
      signIn({ token: { access: data.accessToken, refresh: data.refreshToken }, user: null });
      router.replace(AppRoute.auth.onboarding);
    }
    catch (error) {
      const msg = getApiErrorMessage(error, t('auth.signup.genericError'));
      setErrorMsg(msg);
    }
  };

  const handlePhoneOtpVerify = async (values: Parameters<typeof verifyPhoneSignup>[0]) => {
    setErrorMsg(null);
    try {
      const result = await verifyPhoneSignup(values);
      if (result.accountExists || !result.canContinue) {
        setErrorMsg(t('auth.phone.signupExistingAccount'));
        router.replace({ pathname: AppRoute.auth.login as any, params: { mode: 'phone', phone: values.phone } });
      }
      return result;
    }
    catch (error) {
      const msg = getApiErrorMessage(error, t('auth.signup.genericError'));
      setErrorMsg(msg);
      throw error;
    }
  };

  const handlePhoneOtpRequest = async (phone: string, purpose: 'SIGNUP' | 'RESET_PASSWORD') => {
    setErrorMsg(null);
    try {
      await requestOtp({ phone, purpose });
    }
    catch (error) {
      const msg = getApiErrorMessage(error, t('auth.signup.genericError'));
      setErrorMsg(msg);
      throw error;
    }
  };

  const handleTermsPress = () => {
    Linking.openURL('https://example.com/terms').catch(() => {});
  };

  const handleGoogleSignup = async (idToken: string, role: SignupRole) => {
    setErrorMsg(null);
    setIsGoogleSigningIn(true);
    try {
      let tokenToUse: string | null = null;
      if (pendingGoogleToken && isTokenWithinReuseWindow(pendingGoogleToken)) {
        tokenToUse = pendingGoogleToken.idToken;
      }
      else if (idToken) {
        tokenToUse = idToken;
        setPendingGoogleToken(createTokenWithTimestamp(idToken));
      }

      if (!tokenToUse) {
        try {
          await GoogleSignin.hasPlayServices();
          const userInfo = await GoogleSignin.signIn();
          const payload = userInfo as { idToken?: string; data?: { idToken?: string } };
          const freshToken = payload.data?.idToken ?? payload.idToken;
          if (!freshToken)
            throw new Error('No ID token from Google');
          tokenToUse = freshToken;
          setPendingGoogleToken(createTokenWithTimestamp(freshToken));
        }
        catch {
          setErrorMsg(t('auth.signup.genericError'));
          return;
        }
      }

      const response = await googleAuthService.googleSignup(tokenToUse, role);
      const authUser = { id: response.data.user.id, email: response.data.user.email, role: response.data.user.role as UserRole };

      if (response.data.onboardingRequired) {
        const onboardingRole = getSignupRole(authUser.role);
        if (onboardingRole === UserRole.MANAGER) {
          setOnboardingContext({ email: authUser.email, fullName: response.data.user.fullName, role: onboardingRole });
          signIn({ token: { access: response.data.accessToken, refresh: response.data.refreshToken }, user: null });
          router.replace(AppRoute.manager.setup);
          return;
        }
        setOnboardingContext({ email: authUser.email, fullName: response.data.user.fullName, ...(onboardingRole ? { role: onboardingRole } : {}) });
        signIn({ token: { access: response.data.accessToken, refresh: response.data.refreshToken }, user: null });
        router.replace(AppRoute.auth.onboarding);
        return;
      }

      signIn({ token: { access: response.data.accessToken, refresh: response.data.refreshToken }, user: authUser });
      router.replace(getHomeRouteForRole(authUser.role));
    }
    catch (error) {
      const msg = getApiErrorMessage(error, t('auth.signup.genericError'), code => t(`auth.errors.${code}`, { defaultValue: '' }));
      setErrorMsg(msg);
    }
    finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleGoogleSignupError = (error: Error) => {
    const msg = getApiErrorMessage(error, t('auth.signup.genericError'), code => t(`auth.errors.${code}`, { defaultValue: '' }));
    setErrorMsg(msg);
  };

  return (
    <SignupScreenView
      {...{
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
        handleTermsPress,
        isPending,
        isPhoneSignupPending,
        isOtpPending,
        isPhoneSignupVerifyPending,
        isGoogleSigningIn,
        isGoogleSigninMobileEnabled,
        errorMsg,
        pendingGoogleToken,
        prefillEmailParam,
      }}
    />
  );
}

type SignupScreenViewProps = {
  router: ReturnType<typeof useRouter>;
  t: (key: string, opts?: any) => string;
  signupMode: 'email' | 'phone';
  setSignupMode: (mode: 'email' | 'phone') => void;
  handleSubmit: (values: SignupPayload) => Promise<void>;
  handlePhoneSignup: (values: any) => Promise<void>;
  handlePhoneOtpRequest: (phone: string, purpose: 'SIGNUP' | 'RESET_PASSWORD') => Promise<void>;
  handlePhoneOtpVerify: (values: any) => Promise<any>;
  handleGoogleSignup: (idToken: string, role: SignupRole) => Promise<void>;
  handleGoogleSignupError: (error: Error) => void;
  handleTermsPress: () => void;
  isPending: boolean;
  isPhoneSignupPending: boolean;
  isOtpPending: boolean;
  isPhoneSignupVerifyPending: boolean;
  isGoogleSigningIn: boolean;
  isGoogleSigninMobileEnabled: boolean;
  errorMsg: string | null;
  pendingGoogleToken: ReturnType<typeof createTokenWithTimestamp> | null;
  prefillEmailParam: string;
};

// eslint-disable-next-line max-lines-per-function
function SignupScreenView({
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
  handleTermsPress,
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
  const { language, setLanguage } = useSelectedLanguage();
  const isRTL = language === 'ar';

  const toggleLanguage = () => setLanguage(language === 'en' ? 'ar' : 'en');

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
          {/* Top bar — back chip + corner mark + language switch */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                testID="back-button"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(255,255,255,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  name="arrowL"
                  size={18}
                  color={colors.neutral.white}
                />
              </Pressable>
              <TabaMark size={48} frame="ink" testID="signup-mark" />
            </View>
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
          <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
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
              {t('auth.signup.heroLine1', 'Create your')}
            </Text>
            <View style={{ marginTop: 2, alignSelf: isRTL ? 'flex-end' : 'flex-start' }}>
              <GradientText size={32} weight="700">
                {t('auth.signup.heroLine2', 'classroom.')}
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
              {t(
                'auth.signup.subheadline',
                'Sign up to start tracking sessions, attendance, and progress.',
              )}
            </Text>
          </View>

          {/* Body */}
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

            {/* OR divider */}
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

            {/* Mode toggle (text link, login parity) */}
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

            {/* Spacer */}
            <View style={{ flex: 1, minHeight: 16 }} />

            {/* Already have account */}
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

            {/* Terms / legal */}
            <Text
              style={{
                color: colors.neutral.inkMuted,
                fontSize: 11,
                lineHeight: 16,
                fontWeight: '500',
                textAlign: 'center',
                marginTop: 14,
                marginBottom: Math.max(insets.bottom, 12),
                paddingHorizontal: 8,
              }}
            >
              {t('auth.signup.legalLine', 'By creating an account you agree to Taba3ny\'s ')}
              <Text
                style={{ color: colors.brand.primary, fontWeight: '700' }}
                onPress={handleTermsPress}
                testID="terms-link"
              >
                {t('auth.signup.termsLink')}
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthShell>
  );
}
