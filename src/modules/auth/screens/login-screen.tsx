import type { LoginFormValues } from '@modules/auth/types';
import { LoginForm } from '@modules/auth/components/login-form';
import { AuthLayout } from '@modules/auth/components/ui';
import { useLogin } from '@modules/auth/hooks/use-login';
import { usePhoneLogin } from '@modules/auth/hooks/use-phone-login';
import { googleAuthService } from '@modules/auth/services';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import LottieView from 'lottie-react-native';
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Text, View } from 'react-native';
import { UserRole } from '@/core/auth/roles';
import { getHomeRouteForRole } from '@/core/auth/routing';
import { useFeatureFlags } from '@/core/feature-flags/use-feature-flags';
import { AppRoute } from '@/core/navigation/routes';
import { setOnboardingContext, useAuthStore } from '@/features/auth/use-auth-store';
import { getApiErrorMessage } from '@/shared/services/api-utils';

function getSignupRole(role: UserRole | undefined): 'TEACHER' | 'PARENT' | 'MANAGER' | undefined {
  if (role === UserRole.TEACHER || role === UserRole.PARENT || role === UserRole.MANAGER) {
    return role;
  }

  return undefined;
}

// eslint-disable-next-line max-lines-per-function
export function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: string | string[];
    phone?: string | string[];
  }>();
  const { t } = useTranslation();
  const signIn = useAuthStore.use.signIn();
  const status = useAuthStore.use.status();
  const user = useAuthStore.use.user();
  const onboardingContext = useAuthStore.use.onboardingContext();
  const { mutateAsync: login, isPending } = useLogin();
  const { mutateAsync: phoneLogin, isPending: isPhoneLoginPending } = usePhoneLogin();
  const { isGoogleSigninMobileEnabled, isForgotPasswordEnabled } = useFeatureFlags();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const modeParam = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const phoneParam = Array.isArray(params.phone) ? params.phone[0] : params.phone;
  const initialMode = modeParam === 'phone' ? 'phone' : 'email';
  const initialPhone = typeof phoneParam === 'string' ? phoneParam : '';

  // Onboarding cold-start: token exists but user is null → resume onboarding
  if (status === 'signIn' && !user) {
    if (onboardingContext?.role === UserRole.MANAGER) {
      return <Redirect href={AppRoute.manager.setup} />;
    }
    return <Redirect href={AppRoute.auth.onboarding} />;
  }

  if (status === 'signIn' && user) {
    return <Redirect href={getHomeRouteForRole(user.role)} />;
  }

  const handleSubmit = async (values: LoginFormValues) => {
    setErrorMsg(null);
    try {
      const response = await login(values);

      if (response.onboardingRequired) {
        if (response.user?.role === UserRole.MANAGER) {
          setOnboardingContext({
            email: response.user.email,
            role: UserRole.MANAGER,
            fullName: response.user.fullName,
            phone: response.user.phoneE164 ?? undefined,
          });

          signIn({
            token: { access: response.access, refresh: response.refresh },
            user: null,
          });
          router.replace(AppRoute.manager.setup);
          return;
        }

        // Persist onboarding context before signing in
        if (response.onboardingReason === 'PROFILE_NOT_FOUND' && response.user) {
          const onboardingRole = getSignupRole(response.user.role);
          // User exists in DB — we have role and fullName
          setOnboardingContext({
            email: response.user.email,
            ...(onboardingRole ? { role: onboardingRole } : {}),
            fullName: response.user.fullName,
            phone: response.user.phoneE164 ?? undefined,
          });
        }
        else {
          // USER_NOT_FOUND — no DB user row, only email is known
          setOnboardingContext({ email: values.email });
        }

        signIn({
          token: { access: response.access, refresh: response.refresh },
          user: null,
        });
        router.replace(AppRoute.auth.onboarding);
      }
      else {
        signIn({
          token: { access: response.access, refresh: response.refresh },
          user: response.user,
        });
        router.replace(getHomeRouteForRole(response.user.role));
      }
    }
    catch (error) {
      const msg = getApiErrorMessage(error, t('auth.login.genericError'));
      setErrorMsg(msg);
    }
  };

  const handleGoogleSignIn = async (idToken: string) => {
    setErrorMsg(null);
    setIsGoogleSigningIn(true);

    try {
      const response = await googleAuthService.googleLogin(idToken);

      if (!response.success && response.code === 'AUTH_SIGNUP_REQUIRED') {
        const prefillEmail = response.data?.prefillEmail ?? '';
        if (prefillEmail) {
          setOnboardingContext({ email: prefillEmail });
        }
        router.push({
          pathname: AppRoute.auth.signup as any,
          params: {
            prefillEmail,
            idToken,
          },
        });
        return;
      }

      if (!response.success || !response.data) {
        throw new Error(response.message || t('auth.login.genericError'));
      }

      const authUser = {
        id: response.data.user.id,
        email: response.data.user.email,
        role: response.data.user.role as UserRole,
        fullName: response.data.user.fullName,
      };

      if (response.data.onboardingRequired) {
        const onboardingRole = getSignupRole(authUser.role);
        if (onboardingRole === UserRole.MANAGER) {
          setOnboardingContext({
            email: authUser.email,
            role: onboardingRole,
            fullName: response.data.user.fullName,
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
      const msg = getApiErrorMessage(error, t('auth.login.genericError'), code => t(`auth.errors.${code}`, { defaultValue: '' }));
      setErrorMsg(msg);
    }
    finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleGoogleSignInError = (error: Error) => {
    const msg = getApiErrorMessage(error, t('auth.login.genericError'), code => t(`auth.errors.${code}`, { defaultValue: '' }));
    setErrorMsg(msg);
  };

  const handlePhoneLogin = async (values: { phone: string; password: string }) => {
    setErrorMsg(null);
    try {
      const response = await phoneLogin(values);

      if (response.onboardingRequired) {
        if (response.user?.role === UserRole.MANAGER) {
          setOnboardingContext({
            email: response.user.email ?? '',
            role: UserRole.MANAGER,
            fullName: response.user.fullName,
            phone: response.user.phoneE164 ?? values.phone,
          });
          signIn({
            token: { access: response.access, refresh: response.refresh },
            user: null,
          });
          router.replace(AppRoute.manager.setup);
          return;
        }

        if (response.onboardingReason === 'PROFILE_NOT_FOUND' && response.user) {
          const onboardingRole = getSignupRole(response.user.role);
          setOnboardingContext({
            email: response.user.email ?? '',
            ...(onboardingRole ? { role: onboardingRole } : {}),
            fullName: response.user.fullName,
            phone: response.user.phoneE164 ?? values.phone,
          });
        }
        signIn({
          token: { access: response.access, refresh: response.refresh },
          user: null,
        });
        router.replace(AppRoute.auth.onboarding);
      }
      else {
        signIn({
          token: { access: response.access, refresh: response.refresh },
          user: {
            id: response.user.id,
            email: response.user.email || '',
            role: response.user.role as UserRole,
            fullName: response.user.fullName,
            phoneE164: response.user.phoneE164 ?? null,
          },
        });
        router.replace(getHomeRouteForRole(response.user.role));
      }
    }
    catch (error) {
      const msg = getApiErrorMessage(error, t('auth.login.genericError'));
      setErrorMsg(msg);
    }
  };

  const handleForgotPassword = async (email: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert(
        t('auth.login.forgotPassword'),
        'Please enter your email first.',
      );
      return;
    }

    if (!isForgotPasswordEnabled) {
      Alert.alert(
        t('auth.login.forgotPassword'),
        'Forgot password is currently unavailable.',
      );
      return;
    }

    try {
      const response = await googleAuthService.forgotPassword(trimmedEmail);
      Alert.alert(
        t('auth.login.forgotPassword'),
        response.message
        || 'If an account exists, a password reset email has been sent.',
      );
    }
    catch (error) {
      const msg = getApiErrorMessage(
        error,
        'Unable to request password reset right now.',
      );
      Alert.alert(t('auth.login.forgotPassword'), msg);
    }
  };

  const handlePhoneForgotPassword = () => {
    if (!isForgotPasswordEnabled) {
      Alert.alert(
        t('auth.login.forgotPassword'),
        'Forgot password is currently unavailable.',
      );
      return;
    }

    router.push(AppRoute.auth.resetPassword as any);
  };

  return (
    <AuthLayout testID="login-screen">
      <StatusBar style="dark" translucent />

      {/* Lottie hero */}
      <View className="mt-4 items-center">
        <LottieView
          source={require('@assets/lottie/education-books.json')}
          autoPlay
          loop
          renderMode={Platform.OS === 'android' ? 'HARDWARE' : 'AUTOMATIC'}
          style={{ width: 240, height: 200 }}
        />
      </View>

      {/* Title + subtitle */}
      <View className="my-6 items-center gap-1">
        <Text className="text-[28px] font-bold text-gray-900">
          {t('auth.login.title')}
        </Text>
        <Text className="text-center text-[15px] text-gray-500">
          {t('auth.login.subtitle')}
        </Text>
      </View>

      {/* Login Form */}
      <LoginForm
        onSubmit={handleSubmit}
        onPhoneSubmit={handlePhoneLogin}
        isSubmitting={isPending}
        isPhoneSubmitting={isPhoneLoginPending}
        error={errorMsg}
        onForgotPassword={handleForgotPassword}
        onForgotPhonePassword={handlePhoneForgotPassword}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignInError={handleGoogleSignInError}
        isGoogleSigningIn={isGoogleSigningIn}
        showGoogleSignIn={isGoogleSigninMobileEnabled}
        initialMode={initialMode}
        initialPhone={initialPhone}
      />
    </AuthLayout>
  );
}
