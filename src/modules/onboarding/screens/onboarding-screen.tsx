import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UserRole } from '@/core/auth/roles';
import { getHomeRouteForRole } from '@/core/auth/routing';
import {
  clearDraftData,
  clearOnboardingContext,
  getDraftData,
  setDraftData,
  signIn,
  useAuthStore,
} from '@/features/auth/use-auth-store';
import { getToken } from '@/lib/auth/utils';
import { createProfile, refreshToken, validateToken } from '@/modules/auth/services';
import { getApiErrorMessage, isApiError } from '@/shared/services/api-utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = UserRole.TEACHER | UserRole.PARENT;
const ROLE_OPTIONS: Role[] = [UserRole.TEACHER, UserRole.PARENT];

function getJwtExpiry(accessToken: string): number | null {
  const parts = accessToken.split('.');
  if (parts.length < 2) {
    return null;
  }

  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;

  try {
    if (typeof globalThis.atob !== 'function') {
      return null;
    }
    const payload = JSON.parse(globalThis.atob(padded)) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : null;
  }
  catch {
    return null;
  }
}

function isProfileAlreadyExistsError(error: unknown): boolean {
  if (!isApiError(error)) {
    return false;
  }

  const status = error.response?.status;
  const data = error.response?.data as Record<string, unknown> | undefined;

  const normalize = (value: unknown): string => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    if (Array.isArray(value)) {
      return value
        .filter((item): item is string => typeof item === 'string')
        .join(' ')
        .toLowerCase();
    }
    if (value && typeof value === 'object' && 'message' in (value as Record<string, unknown>)) {
      return normalize((value as Record<string, unknown>).message);
    }
    return '';
  };

  const normalizedMessage = [
    normalize(data?.message),
    normalize(data?.error),
    normalize((error as { message?: unknown }).message),
  ]
    .filter(Boolean)
    .join(' ');

  return (status === 400 || status === 409)
    && (normalizedMessage.includes('profile already exists')
      || normalizedMessage.includes('الملف الشخصي موجود'));
}

// ─── OnboardingScreen ─────────────────────────────────────────────────────────

// eslint-disable-next-line max-lines-per-function
export function OnboardingScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isRTL = i18n.language === 'ar';

  const onboardingContext = useAuthStore.use.onboardingContext();

  // ─── Form state ─────────────────────────────────────────────────────────────

  const [fullName, setFullName] = React.useState(onboardingContext?.fullName ?? '');
  const initialDraft = React.useMemo(() => getDraftData(), []);
  const [phone, setPhone] = React.useState(initialDraft?.phone ?? '');
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(
    (onboardingContext?.role as Role | undefined) ?? null,
  );
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Show role selector only when role is missing from onboardingContext
  const showRoleSelector = !onboardingContext?.role;

  // ─── Token expiry check + refresh ────────────────────────────────────────────

  async function ensureFreshToken(): Promise<string> {
    const token = getToken();
    if (!token?.access) {
      throw new Error('No access token');
    }

    try {
      const exp = getJwtExpiry(token.access);
      if (!exp) {
        return token.access;
      }

      const secondsUntilExpiry = exp - Date.now() / 1000;

      if (secondsUntilExpiry < 60) {
        const result = await refreshToken(token.refresh);
        signIn({ token: { access: result.accessToken, refresh: result.refreshToken }, user: null });
        return result.accessToken;
      }
    }
    catch {
      // If decode fails, proceed with current token
    }

    return token.access;
  }

  // ─── Submit handler ──────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setErrorMsg(null);

    const role: Role | null = (onboardingContext?.role as Role | undefined) ?? selectedRole;

    if (!role) {
      setErrorMsg(t('auth.onboarding.genericError'));
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg(t('auth.onboarding.genericError'));
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Ensure token is fresh (refresh if < 60s to expiry)
      await ensureFreshToken();

      // 2. Call profile endpoint
      try {
        await createProfile(role, { name: fullName.trim(), phone: phone.trim() || undefined });
      }
      catch (error) {
        // If profile already exists, treat onboarding as already completed and continue.
        if (!isProfileAlreadyExistsError(error)) {
          throw error;
        }
      }

      // 3. Call validate-token to get full user object
      const validatedUser = await validateToken();

      // 4. Update Auth_Store with full user, clear onboarding state
      const currentToken = getToken();
      if (!currentToken) {
        throw new Error('Missing auth token after onboarding');
      }
      signIn({ token: currentToken, user: validatedUser });
      clearOnboardingContext();
      clearDraftData();

      // 5. Navigate to role dashboard
      router.replace(getHomeRouteForRole(validatedUser.role));
    }
    catch (error) {
      // Save draft data on failure
      setDraftData({ phone: phone.trim() || undefined });

      const msg = getApiErrorMessage(error, t('auth.onboarding.genericError'));
      setErrorMsg(msg);
    }
    finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
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
          <View style={styles.container}>
            {/* Header */}
            <Text style={styles.title}>{t('auth.onboarding.title')}</Text>

            {/* API Error */}
            {errorMsg
              ? (
                <Text style={styles.apiError} testID="onboarding-error">
                  {errorMsg}
                </Text>
              )
              : null}

            {/* Role Selector — only shown when role is missing from context */}
            {showRoleSelector && (
              <View style={styles.formBlock}>
                <Text style={styles.roleLabel}>{t('auth.signup.roleLabel')}</Text>
                <View style={styles.roleCardsRow}>
                  {ROLE_OPTIONS.map((role) => {
                    const isSelected = selectedRole === role;
                    return (
                      <Pressable
                        key={role}
                        style={[styles.roleCard, isSelected && styles.roleCardSelected]}
                        onPress={() => setSelectedRole(role)}
                        testID={`role-card-${role.toLowerCase()}`}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                      >
                        <Text style={styles.roleAvatar}>
                          {role === UserRole.TEACHER ? '👩‍🏫' : '👨‍👩‍👧'}
                        </Text>
                        <Text style={[styles.roleCardLabel, isSelected && styles.roleCardLabelSelected]}>
                          {role === UserRole.TEACHER ? t('auth.signup.teacherLabel') : t('auth.signup.parentLabel')}
                        </Text>
                        <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Full Name */}
            <View style={styles.formBlock}>
              <Text style={styles.label}>{t('auth.signup.fullNameLabel')}</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                autoCorrect={false}
                placeholder={t('auth.signup.fullNamePlaceholder')}
                placeholderTextColor="#94A3B8"
                testID="fullName-input"
                textAlign={isRTL ? 'right' : 'left'}
                style={[styles.input, isRTL && styles.inputRTL]}
              />
            </View>

            {/* Phone Number */}
            <View style={styles.formBlock}>
              <Text style={styles.label}>{t('auth.onboarding.phoneLabel')}</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCorrect={false}
                placeholder={t('auth.onboarding.phonePlaceholder')}
                placeholderTextColor="#94A3B8"
                testID="phone-input"
                textAlign={isRTL ? 'right' : 'left'}
                style={[styles.input, isRTL && styles.inputRTL]}
              />
            </View>

            {/* Submit Button */}
            <Pressable
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={() => void handleSubmit()}
              disabled={isSubmitting}
              testID="onboarding-submit-button"
            >
              {isSubmitting
                ? <ActivityIndicator color="#FFFFFF" />
                : (
                  <Text style={styles.submitButtonLabel}>
                    {t('auth.onboarding.submit')}
                  </Text>
                )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  apiError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 10,
    borderWidth: 1,
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    gap: 14,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  flex: {
    flex: 1,
  },
  formBlock: {
    width: '100%',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 14,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 20,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  inputRTL: {
    writingDirection: 'rtl',
  },
  label: {
    color: '#334155',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'left',
  },
  radioInner: {
    backgroundColor: '#2563EB',
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  radioOuter: {
    alignItems: 'center',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    marginTop: 8,
    width: 20,
  },
  radioOuterSelected: {
    borderColor: '#2563EB',
  },
  roleAvatar: {
    fontSize: 36,
    marginBottom: 6,
  },
  roleCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 16,
    borderWidth: 2,
    flex: 1,
    paddingVertical: 18,
  },
  roleCardLabel: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '600',
  },
  roleCardLabelSelected: {
    color: '#2563EB',
  },
  roleCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  roleCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 58,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonLabel: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  title: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'left',
  },
});
