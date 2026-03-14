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
            {/* Email / Phone mode toggle */}
            <View style={styles.modeToggle}>
              <Pressable
                style={[styles.modeTab, signupMode === 'email' && styles.modeTabActive]}
                onPress={() => setSignupMode('email')}
              >
                <Text style={signupMode === 'email' ? styles.modeTabLabelActive : styles.modeTabLabel}>
                  {t('auth.signup.emailTab')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modeTab, signupMode === 'phone' && styles.modeTabActive]}
                onPress={() => setSignupMode('phone')}
              >
                <Text style={signupMode === 'phone' ? styles.modeTabLabelActive : styles.modeTabLabel}>
                  {t('auth.signup.phoneTab')}
                </Text>
              </Pressable>
            </View>

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
  modeTab: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  modeTabActive: {
    borderBottomColor: '#2563EB',
    borderBottomWidth: 2,
  },
  modeTabLabel: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  modeTabLabelActive: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '700',
  },
  modeToggle: {
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginBottom: 20,
  },
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
