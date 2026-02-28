import type { LoginFormValues } from '../types';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { useState } from 'react';

import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserRole } from '@/core/auth/roles';
import { getHomeRouteForRole } from '@/core/auth/routing';
import { useFeatureFlags } from '@/core/feature-flags/use-feature-flags';
import { AppRoute } from '@/core/navigation/routes';
import { setOnboardingContext, useAuthStore } from '@/features/auth/use-auth-store';
import { getApiErrorMessage } from '@/shared/services/api-utils';

import { LoginForm } from '../components/login-form';
import { useLogin } from '../hooks/use-login';
import { googleAuthService } from '../services';

// eslint-disable-next-line max-lines-per-function
export function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const signIn = useAuthStore.use.signIn();
  const status = useAuthStore.use.status();
  const user = useAuthStore.use.user();
  const { mutateAsync: login, isPending } = useLogin();
  const { isGoogleSigninMobileEnabled, isForgotPasswordEnabled } = useFeatureFlags();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  // Onboarding cold-start: token exists but user is null → resume onboarding
  if (status === 'signIn' && !user) {
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
        // Persist onboarding context before signing in
        if (response.onboardingReason === 'PROFILE_NOT_FOUND' && response.user) {
          // User exists in DB — we have role and fullName
          setOnboardingContext({
            email: response.user.email,
            role: response.user.role as 'TEACHER' | 'PARENT',
            fullName: response.user.fullName,
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
      };

      if (response.data.onboardingRequired) {
        const onboardingRole
          = authUser.role === UserRole.TEACHER || authUser.role === UserRole.PARENT
            ? (authUser.role as 'TEACHER' | 'PARENT')
            : undefined;
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
      const msg = getApiErrorMessage(error, t('auth.login.genericError'));
      setErrorMsg(msg);
    }
    finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleGoogleSignInError = (error: Error) => {
    const msg = getApiErrorMessage(error, t('auth.login.genericError'));
    setErrorMsg(msg);
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <StatusBar style="light" translucent />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LoginForm
            onSubmit={handleSubmit}
            isSubmitting={isPending}
            error={errorMsg}
            onForgotPassword={handleForgotPassword}
            onGoogleSignIn={handleGoogleSignIn}
            onGoogleSignInError={handleGoogleSignInError}
            isGoogleSigningIn={isGoogleSigningIn}
            showGoogleSignIn={isGoogleSigninMobileEnabled}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
