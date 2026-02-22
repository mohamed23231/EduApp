import type { LoginFormValues } from '../types';
import axios from 'axios';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getHomeRouteForRole } from '@/core/auth/routing';
import { AppRoute } from '@/core/navigation/routes';
import { setOnboardingContext, useAuthStore } from '@/features/auth/use-auth-store';

import { LoginForm } from '../components/login-form';
import { useLogin } from '../hooks/use-login';

export function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const signIn = useAuthStore.use.signIn();
  const status = useAuthStore.use.status();
  const user = useAuthStore.use.user();
  const { mutateAsync: login, isPending } = useLogin();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      let msg = t('auth.login.genericError');
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          msg = error.response.data.message;
        }
      }
      setErrorMsg(msg);
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
