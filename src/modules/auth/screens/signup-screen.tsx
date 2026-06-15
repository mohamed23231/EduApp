import type { SignupPayload } from '../types';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
import { UserRole } from '@/core/auth/roles';
import { getHomeRouteForRole } from '@/core/auth/routing';
import { useFeatureFlags } from '@/core/feature-flags/use-feature-flags';
import { AppRoute } from '@/core/navigation/routes';
import { setOnboardingContext, signIn, useAuthStore } from '@/features/auth/use-auth-store';
import {
  createTokenWithTimestamp,
  isTokenWithinReuseWindow,
} from '@/lib/auth/token-reuse-window';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import { useAuthErrorToast } from '../hooks/use-auth-error-toast';
import {
  usePhoneOtpRequest,
  usePhoneSignup,
  usePhoneSignupVerify,
} from '../hooks/use-phone-signup';
import { useSignup } from '../hooks/use-signup';
import { googleAuthService } from '../services';
import { SignupScreenView } from './signup-screen-view';

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
  const showAuthError = useAuthErrorToast();
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

  // Network / rate-limit get a transient toast (locked error matrix); the
  // generic case keeps the inline backend message (signup enumeration is a
  // separate eng/security decision, intentionally not merged here).
  const reportSignupError = (error: unknown) => {
    const kind = showAuthError(error, 'signup');
    if (kind === 'generic') {
      setErrorMsg(getApiErrorMessage(error, t('auth.signup.genericError')));
    }
  };

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
      reportSignupError(error);
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
      reportSignupError(error);
    }
  };

  const handlePhoneOtpVerify = async (values: Parameters<typeof verifyPhoneSignup>[0]) => {
    setErrorMsg(null);
    try {
      const result = await verifyPhoneSignup(values);
      if (result.accountExists || !result.canContinue) {
        setErrorMsg(t('auth.phone.signupExistingAccount'));
        router.replace({ pathname: AppRoute.auth.login as never, params: { mode: 'phone', phone: values.phone } });
      }
      return result;
    }
    catch (error) {
      reportSignupError(error);
      throw error;
    }
  };

  const handlePhoneOtpRequest = async (phone: string, purpose: 'SIGNUP' | 'RESET_PASSWORD') => {
    setErrorMsg(null);
    try {
      await requestOtp({ phone, purpose });
    }
    catch (error) {
      reportSignupError(error);
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
      router={router}
      t={t}
      signupMode={signupMode}
      setSignupMode={setSignupMode}
      handleSubmit={handleSubmit}
      handlePhoneSignup={handlePhoneSignup}
      handlePhoneOtpRequest={handlePhoneOtpRequest}
      handlePhoneOtpVerify={handlePhoneOtpVerify}
      handleGoogleSignup={handleGoogleSignup}
      handleGoogleSignupError={handleGoogleSignupError}
      handleTermsPress={handleTermsPress}
      isPending={isPending}
      isPhoneSignupPending={isPhoneSignupPending}
      isOtpPending={isOtpPending}
      isPhoneSignupVerifyPending={isPhoneSignupVerifyPending}
      isGoogleSigningIn={isGoogleSigningIn}
      isGoogleSigninMobileEnabled={isGoogleSigninMobileEnabled}
      errorMsg={errorMsg}
      pendingGoogleToken={pendingGoogleToken}
      prefillEmailParam={prefillEmailParam}
    />
  );
}
