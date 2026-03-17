import type { SignupPayload } from '@modules/auth/types';
import { Ionicons } from '@expo/vector-icons';
import { PhoneSignupForm } from '@modules/auth/components/phone-signup-form';
import { SignupForm } from '@modules/auth/components/signup-form';
import {
  AuthLayout,
  SegmentedControl,
} from '@modules/auth/components/ui';
import {
  usePhoneOtpRequest,
  usePhoneSignup,
  usePhoneSignupVerify,
} from '@modules/auth/hooks/use-phone-signup';
import { useSignup } from '@modules/auth/hooks/use-signup';
import { googleAuthService } from '@modules/auth/services';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import LottieView from 'lottie-react-native';
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
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
        setOnboardingContext({
          role: signupRole,
          email: data.user.email,
          fullName: data.user.fullName,
        });

        signIn({
          token: { access: data.accessToken, refresh: data.refreshToken },
          user: null,
        });

        router.replace(AppRoute.manager.setup);
        return;
      }

      setOnboardingContext({
        role: signupRole,
        email: data.user.email,
        fullName: data.user.fullName,
      });

      signIn({
        token: { access: data.accessToken, refresh: data.refreshToken },
        user: null,
      });

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

        signIn({
          token: { access: data.accessToken, refresh: data.refreshToken },
          user: null,
        });

        router.replace(AppRoute.manager.setup);
        return;
      }

      setOnboardingContext({
        role: signupRole ?? 'PARENT',
        email: data.user?.email ?? '',
        fullName: data.user?.fullName ?? data.fullName,
        phone: data.user?.phoneE164 ?? data.phoneE164 ?? undefined,
      });

      signIn({
        token: { access: data.accessToken, refresh: data.refreshToken },
        user: null,
      });

      router.replace(AppRoute.auth.onboarding);
    }
    catch (error) {
      const msg = getApiErrorMessage(error, t('auth.signup.genericError'));
      setErrorMsg(msg);
    }
  };

  const handlePhoneOtpVerify = async (
    values: Parameters<typeof verifyPhoneSignup>[0],
  ) => {
    setErrorMsg(null);
    try {
      const result = await verifyPhoneSignup(values);

      if (result.accountExists || !result.canContinue) {
        setErrorMsg(t('auth.phone.signupExistingAccount'));
        router.replace({
          pathname: AppRoute.auth.login as any,
          params: {
            mode: 'phone',
            phone: values.phone,
          },
        });
      }

      return result;
    }
    catch (error) {
      const msg = getApiErrorMessage(error, t('auth.signup.genericError'));
      setErrorMsg(msg);
      throw error;
    }
  };

  const handlePhoneOtpRequest = async (
    phone: string,
    purpose: 'SIGNUP' | 'RESET_PASSWORD',
  ) => {
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
    Linking.openURL('https://example.com/terms').catch(() => { });
  };

  const handleGoogleSignup = async (
    idToken: string,
    role: SignupRole,
  ) => {
    setErrorMsg(null);
    setIsGoogleSigningIn(true);

    try {
      // Check token reuse window — re-acquire if expired (Req 10.7, 10.8)
      let tokenToUse: string | null = null;

      if (pendingGoogleToken && isTokenWithinReuseWindow(pendingGoogleToken)) {
        tokenToUse = pendingGoogleToken.idToken;
      }
      else if (idToken) {
        tokenToUse = idToken;
        setPendingGoogleToken(createTokenWithTimestamp(idToken));
      }

      if (!tokenToUse) {
        // Token missing or expired — re-initiate Google Sign-In
        try {
          await GoogleSignin.hasPlayServices();
          const userInfo = await GoogleSignin.signIn();
          const payload = userInfo as { idToken?: string; data?: { idToken?: string } };
          const freshToken = payload.data?.idToken ?? payload.idToken;
          if (!freshToken) {
            throw new Error('No ID token from Google');
          }
          tokenToUse = freshToken;
          setPendingGoogleToken(createTokenWithTimestamp(freshToken));
        }
        catch {
          setErrorMsg(t('auth.signup.genericError'));
          return;
        }
      }

      const response = await googleAuthService.googleSignup(tokenToUse, role);

      const authUser = {
        id: response.data.user.id,
        email: response.data.user.email,
        role: response.data.user.role as UserRole,
      };

      if (response.data.onboardingRequired) {
        const onboardingRole = getSignupRole(authUser.role);

        if (onboardingRole === UserRole.MANAGER) {
          setOnboardingContext({
            email: authUser.email,
            fullName: response.data.user.fullName,
            role: onboardingRole,
          });
          signIn({
            token: {
              access: response.data.accessToken,
              refresh: response.data.refreshToken,
            },
            user: null,
          });
          router.replace(AppRoute.manager.setup);
          return;
        }

        setOnboardingContext({
          email: authUser.email,
          fullName: response.data.user.fullName,
          ...(onboardingRole ? { role: onboardingRole } : {}),
        });
        signIn({
          token: {
            access: response.data.accessToken,
            refresh: response.data.refreshToken,
          },
          user: null,
        });
        router.replace(AppRoute.auth.onboarding);
        return;
      }

      signIn({
        token: {
          access: response.data.accessToken,
          refresh: response.data.refreshToken,
        },
        user: authUser,
      });
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

  // Build consent text with tappable terms link
  const consentRaw = t('auth.signup.consent', {
    terms: '§TERMS§',
    privacy: t('auth.signup.termsLink'),
  });
  const consentParts = consentRaw.split('§TERMS§');

  return (
    <AuthLayout testID="signup-screen">
      <StatusBar style="dark" translucent />

      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        className="mt-2 mb-4 size-10 items-center justify-center rounded-full border border-gray-200"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        testID="back-button"
      >
        <Ionicons name="chevron-back" size={20} color="#374151" />
      </Pressable>

      {/* Lottie hero */}
      <View className="items-center">
        <LottieView
          source={require('@assets/lottie/education-books.json')}
          autoPlay
          loop
          renderMode={Platform.OS === 'android' ? 'HARDWARE' : 'AUTOMATIC'}
          style={{ width: 200, height: 160 }}
        />
      </View>

      {/* Title + subtitle */}
      <View className="mt-4 mb-6 items-center gap-1">
        <Text className="text-[28px] font-bold text-gray-900">
          {t('auth.signup.title')}
        </Text>
        <Text className="text-center text-[15px] text-gray-500">
          {t('auth.signup.subtitle')}
        </Text>
      </View>

      {/* Email / Phone mode toggle */}
      <View className="mb-5">
        <SegmentedControl
          segments={[t('auth.signup.emailTab'), t('auth.signup.phoneTab')]}
          activeIndex={signupMode === 'email' ? 0 : 1}
          onChange={index => setSignupMode(index === 0 ? 'email' : 'phone')}
        />
      </View>

      {/* Form */}
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

      {/* Consent text */}
      <View className="mt-4 px-1">
        <Text className="text-center text-[13px]/5 text-slate-500">
          {consentParts[0]}
          <Text
            className="font-semibold text-blue-600 underline"
            onPress={handleTermsPress}
            testID="terms-link"
          >
            {t('auth.signup.termsLink')}
          </Text>
          {consentParts[1] ?? ''}
        </Text>
      </View>

      {/* Already have an account */}
      <View className="mt-5 mb-8 flex-row items-center justify-center gap-1.5">
        <Text className="text-base font-medium text-slate-500">
          {t('auth.signup.alreadyHaveAccount')}
        </Text>
        <Pressable
          onPress={() => router.replace(AppRoute.auth.login)}
          testID="login-link"
        >
          <Text className="text-base font-bold text-blue-600">
            {t('auth.signup.loginLink')}
          </Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
