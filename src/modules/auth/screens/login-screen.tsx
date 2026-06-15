import type { LoginFormValues } from '../types';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { useState } from 'react';

import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { useToast } from '@/components/ui/toast-host';
import { UserRole } from '@/core/auth/roles';
import { getHomeRouteForRole } from '@/core/auth/routing';
import { useFeatureFlags } from '@/core/feature-flags/use-feature-flags';
import { AppRoute } from '@/core/navigation/routes';
import { setOnboardingContext, useAuthStore } from '@/features/auth/use-auth-store';
import { getApiErrorMessage } from '@/shared/services/api-utils';

import { LoginForm } from '../components/login-form';
import { useAuthErrorToast } from '../hooks/use-auth-error-toast';
import { useGoogleLogin } from '../hooks/use-google-login';
import { useLogin } from '../hooks/use-login';
import { usePhoneLogin } from '../hooks/use-phone-login';
import { googleAuthService } from '../services';

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
  const toast = useToast();
  const showAuthError = useAuthErrorToast();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { handleGoogleSignIn, handleGoogleSignInError, isGoogleSigningIn }
    = useGoogleLogin(setErrorMsg);
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

        if (response.onboardingReason === 'PROFILE_NOT_FOUND' && response.user) {
          const onboardingRole = getSignupRole(response.user.role);
          setOnboardingContext({
            email: response.user.email,
            ...(onboardingRole ? { role: onboardingRole } : {}),
            fullName: response.user.fullName,
            phone: response.user.phoneE164 ?? undefined,
          });
        }
        else {
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
      showAuthError(error, 'login');
    }
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
      showAuthError(error, 'login');
    }
  };

  const handleForgotPassword = async (email: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.show({
        kind: 'info',
        message: t('auth.login.forgotPasswordEmailRequired', 'Please enter your email first.'),
      });
      return;
    }

    if (!isForgotPasswordEnabled) {
      toast.show({
        kind: 'info',
        message: t('auth.login.forgotPasswordUnavailable', 'Forgot password is currently unavailable.'),
      });
      return;
    }

    try {
      const response = await googleAuthService.forgotPassword(trimmedEmail);
      toast.show({
        kind: 'success',
        message:
          response.message
          || t('auth.login.forgotPasswordSent', 'If an account exists, a password reset email has been sent.'),
      });
    }
    catch (error) {
      const msg = getApiErrorMessage(
        error,
        t('auth.login.forgotPasswordError', 'Unable to request password reset right now.'),
      );
      toast.show({ kind: 'error', message: msg });
    }
  };

  const handlePhoneForgotPassword = () => {
    if (!isForgotPasswordEnabled) {
      toast.show({
        kind: 'info',
        message: t('auth.login.forgotPasswordUnavailable', 'Forgot password is currently unavailable.'),
      });
      return;
    }

    router.push(AppRoute.auth.resetPassword as any);
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" translucent />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
