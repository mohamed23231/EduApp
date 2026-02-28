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
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
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
import { SignupForm } from '../components/signup-form';
import { useSignup } from '../hooks/use-signup';
import { googleAuthService } from '../services';

function ChevronLeft({ color = '#0F172A' }: { color?: string }) {
  return (
    <Svg width={10} height={18} viewBox="0 0 10 18" fill="none">
      <Path
        d="M9 1L1 9L9 17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
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
  const { mutateAsync: signup, isPending } = useSignup();
  const { isGoogleSigninMobileEnabled } = useFeatureFlags();
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
    return <Redirect href={AppRoute.auth.onboarding} />;
  }

  if (status === 'signIn' && user) {
    return <Redirect href={getHomeRouteForRole(user.role)} />;
  }

  const handleSubmit = async (values: SignupPayload) => {
    setErrorMsg(null);
    try {
      const data = await signup(values);

      setOnboardingContext({
        role: data.user.role as 'TEACHER' | 'PARENT',
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

  const handleTermsPress = () => {
    Linking.openURL('https://example.com/terms').catch(() => { });
  };

  const handleGoogleSignup = async (
    idToken: string,
    role: 'TEACHER' | 'PARENT',
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
        const onboardingRole
          = authUser.role === UserRole.TEACHER || authUser.role === UserRole.PARENT
            ? (authUser.role as 'TEACHER' | 'PARENT')
            : undefined;
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
      const msg = getApiErrorMessage(error, t('auth.signup.genericError'));
      setErrorMsg(msg);
    }
    finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleGoogleSignupError = (error: Error) => {
    const msg = getApiErrorMessage(error, t('auth.signup.genericError'));
    setErrorMsg(msg);
  };

  // Build consent text with tappable terms link
  const consentRaw = t('auth.signup.consent', {
    terms: '§TERMS§',
    privacy: t('auth.signup.termsLink'),
  });
  const consentParts = consentRaw.split('§TERMS§');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" translucent />
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
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              testID="back-button"
            >
              <ChevronLeft />
            </Pressable>
            <Text style={styles.headerTitle}>{t('auth.signup.title')}</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Form */}
          <View style={styles.content}>
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

            {/* Consent text */}
            <View style={styles.consentRow}>
              <Text style={styles.consentText}>
                {consentParts[0]}
                <Text
                  style={styles.consentLink}
                  onPress={handleTermsPress}
                  testID="terms-link"
                >
                  {t('auth.signup.termsLink')}
                </Text>
                {consentParts[1] ?? ''}
              </Text>
            </View>

            {/* Already have an account */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>
                {t('auth.signup.alreadyHaveAccount')}
              </Text>
              <Pressable
                onPress={() => router.replace(AppRoute.auth.login)}
                testID="login-link"
              >
                <Text style={styles.loginLink}>
                  {t('auth.signup.loginLink')}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  consentLink: {
    color: '#2563EB',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  consentRow: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  consentText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  loginLink: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '700',
  },
  loginRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
