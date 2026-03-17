import type { UserRole } from '@/core/auth/roles';
import {
  AuthButton,
  AuthInput,
  AuthLayout,
  ROLE_OPTIONS,
  RoleCards,
} from '@modules/auth/components/ui';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import LottieView from 'lottie-react-native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  Text,
  View,
} from 'react-native';
import { PhoneField } from '@/components/ui';
import { getHomeRouteForRole } from '@/core/auth/routing';
import {
  clearDraftData,
  clearOnboardingContext,
  getDraftData,
  setOnboardingContext as persistOnboardingContext,
  setDraftData,
  signIn,
  useAuthStore,
} from '@/features/auth/use-auth-store';
import { getToken } from '@/lib/auth/utils';
import {
  createProfile,
  getOnboardingContext as fetchOnboardingContext,
  refreshToken,
  validateToken,
} from '@/modules/auth/services';
import { getApiErrorMessage, isApiError } from '@/shared/services/api-utils';
import {
  buildE164Phone,
  DEFAULT_COUNTRY_CODE,
  getPhoneValidationErrorKey,
  splitE164Phone,
} from '@/shared/utils/phone';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = UserRole.TEACHER | UserRole.PARENT;

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
  const knownPhone = React.useMemo(() => {
    const value = onboardingContext?.phone?.trim();
    return value && value.length > 0 ? value : null;
  }, [onboardingContext?.phone]);

  // ─── Form state ─────────────────────────────────────────────────────────────

  const [fullName, setFullName] = React.useState(onboardingContext?.fullName ?? '');
  const initialDraft = React.useMemo(() => (knownPhone ? null : getDraftData()), [knownPhone]);
  const initialPhone = React.useMemo(
    () => splitE164Phone(initialDraft?.phone),
    [initialDraft?.phone],
  );
  const [phoneCountryCode, setPhoneCountryCode] = React.useState(initialPhone.countryCode ?? DEFAULT_COUNTRY_CODE);
  const [phoneLocalNumber, setPhoneLocalNumber] = React.useState(initialPhone.localNumber);
  const [selectedRole, setSelectedRole] = React.useState<Role | null>(
    (onboardingContext?.role as Role | undefined) ?? null,
  );
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResolvingKnownPhone, setIsResolvingKnownPhone] = React.useState(!knownPhone);

  // Show role selector only when role is missing from onboardingContext
  const showRoleSelector = !onboardingContext?.role;

  React.useEffect(() => {
    let cancelled = false;

    async function hydrateKnownPhone() {
      if (knownPhone || !onboardingContext) {
        if (!cancelled) {
          setIsResolvingKnownPhone(false);
        }
        return;
      }

      if (!cancelled) {
        setIsResolvingKnownPhone(true);
      }

      try {
        const remoteContext = await fetchOnboardingContext();
        const remotePhone = remoteContext.phoneE164?.trim();
        if (!remotePhone) {
          return;
        }

        persistOnboardingContext({
          email: onboardingContext.email || remoteContext.email || '',
          role: onboardingContext.role ?? (remoteContext.role as 'TEACHER' | 'PARENT' | undefined),
          fullName: onboardingContext.fullName ?? remoteContext.fullName,
          phone: remotePhone,
        });
      }
      catch {
        // Best-effort hydration for stale onboarding_context entries.
      }
      finally {
        if (!cancelled) {
          setIsResolvingKnownPhone(false);
        }
      }
    }

    void hydrateKnownPhone();

    return () => {
      cancelled = true;
    };
  }, [
    knownPhone,
    onboardingContext?.email,
    onboardingContext?.fullName,
    onboardingContext?.phone,
    onboardingContext?.role,
  ]);

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
    const enteredPhone = buildE164Phone(phoneCountryCode, phoneLocalNumber);
    const normalizedPhone = knownPhone ?? enteredPhone;
    const hasPhoneInput = !knownPhone && phoneLocalNumber.trim().length > 0;

    if (!role) {
      setErrorMsg(t('auth.onboarding.genericError'));
      return;
    }

    if (!fullName.trim()) {
      setErrorMsg(t('auth.onboarding.genericError'));
      return;
    }

    if (hasPhoneInput && !enteredPhone) {
      setErrorMsg(t(getPhoneValidationErrorKey(phoneCountryCode)));
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Ensure token is fresh (refresh if < 60s to expiry)
      await ensureFreshToken();

      // 2. Call profile endpoint
      try {
        await createProfile(role, { name: fullName.trim(), phone: normalizedPhone ?? undefined });
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
      if (!knownPhone) {
        setDraftData({ phone: enteredPhone ?? undefined });
      }

      const msg = getApiErrorMessage(error, t('auth.onboarding.genericError'));
      setErrorMsg(msg);
    }
    finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <AuthLayout testID="onboarding-screen">
      <StatusBar style="dark" translucent />

      {/* Lottie hero */}
      <View className="mt-4 items-center">
        <LottieView
          source={require('@assets/lottie/education-welcome.json')}
          autoPlay
          loop
          renderMode={Platform.OS === 'android' ? 'HARDWARE' : 'AUTOMATIC'}
          style={{ width: 200, height: 160 }}
        />
      </View>

      {/* Title + subtitle */}
      <View className="mt-4 mb-6 items-center gap-1">
        <Text className="text-[28px] font-bold text-gray-900">
          {t('auth.onboarding.title')}
        </Text>
        <Text className="text-center text-[15px] text-gray-500">
          {t('auth.onboarding.subtitle')}
        </Text>
      </View>

      {/* API Error */}
      {errorMsg
        ? (
            <View className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
              <Text className="text-center text-[14px] font-medium text-red-600" testID="onboarding-error">
                {errorMsg}
              </Text>
            </View>
          )
        : null}

      {/* Role Selector — only shown when role is missing from context */}
      {showRoleSelector && (
        <View className="mb-4">
          <RoleCards
            roles={[ROLE_OPTIONS.TEACHER, ROLE_OPTIONS.PARENT]}
            selected={selectedRole}
            onSelect={value => setSelectedRole(value as Role)}
            overlineLabel={t('auth.signup.roleLabel')}
          />
        </View>
      )}

      {/* Full Name */}
      <View className="mb-4">
        <AuthInput
          label={t('auth.signup.fullNameLabel')}
          value={fullName}
          onChangeText={setFullName}
          autoCorrect={false}
          placeholder={t('auth.signup.fullNamePlaceholder')}
          textAlign={isRTL ? 'right' : 'left'}
          testID="fullName-input"
        />
      </View>

      {/* Phone Number */}
      {!knownPhone && !isResolvingKnownPhone && (
        <View className="mb-4">
          <PhoneField
            label={t('auth.onboarding.phoneLabel')}
            countryCode={phoneCountryCode}
            localNumber={phoneLocalNumber}
            onCountryCodeChange={setPhoneCountryCode}
            onLocalNumberChange={setPhoneLocalNumber}
            testIDPrefix="onboarding-phone"
          />
        </View>
      )}

      {/* Submit Button */}
      <View className="mt-2 mb-8">
        <AuthButton
          variant="blue"
          title={t('auth.onboarding.submit')}
          onPress={() => void handleSubmit()}
          disabled={isSubmitting}
          loading={isSubmitting}
        />
      </View>
    </AuthLayout>
  );
}
