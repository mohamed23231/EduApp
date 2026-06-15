import type { UserRole } from '@/core/auth/roles';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, PhoneField, PressButton } from '@/components/ui';
import colors from '@/components/ui/colors';
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
import {
  FullNameField,
  OnboardingHero,
  OnboardingLegalNote,
  RolePillRow,
} from '@/modules/onboarding/components/onboarding';
import { getJwtExpiry, isProfileAlreadyExistsError } from '@/modules/onboarding/utils/onboarding-helpers';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import {
  buildE164Phone,
  DEFAULT_COUNTRY_CODE,
  getPhoneValidationErrorKey,
  splitE164Phone,
} from '@/shared/utils/phone';

/**
 * OnboardingScreen — paper canvas variant per `contracts/visual-auth.md` §153.
 * The ONE auth surface that intentionally breaks the dark shell pattern: the
 * shift to paper signals "you're inside now" after OTP verification.
 *
 * Visual: paper background, ink hero ("Tell us about you" + gradient second
 * line), role pill row (ink variant), paper-card fields, gradient CTA.
 */

type Role = UserRole.TEACHER | UserRole.PARENT;

// eslint-disable-next-line max-lines-per-function
export function OnboardingScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = i18n.language === 'ar';

  const onboardingContext = useAuthStore.use.onboardingContext();
  const knownPhone = React.useMemo(() => {
    const value = onboardingContext?.phone?.trim();
    return value && value.length > 0 ? value : null;
  }, [onboardingContext?.phone]);

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

  const showRoleSelector = !onboardingContext?.role;

  React.useEffect(() => {
    let cancelled = false;
    async function hydrateKnownPhone() {
      if (knownPhone || !onboardingContext) {
        if (!cancelled)
          setIsResolvingKnownPhone(false);
        return;
      }
      if (!cancelled)
        setIsResolvingKnownPhone(true);
      try {
        const remoteContext = await fetchOnboardingContext();
        const remotePhone = remoteContext.phoneE164?.trim();
        if (!remotePhone)
          return;
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
        if (!cancelled)
          setIsResolvingKnownPhone(false);
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

  async function ensureFreshToken(): Promise<string> {
    const token = getToken();
    if (!token?.access)
      throw new Error('No access token');
    try {
      const exp = getJwtExpiry(token.access);
      if (!exp)
        return token.access;
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
      await ensureFreshToken();
      try {
        await createProfile(role, { name: fullName.trim(), phone: normalizedPhone ?? undefined });
      }
      catch (error) {
        if (!isProfileAlreadyExistsError(error))
          throw error;
      }
      const validatedUser = await validateToken();
      const currentToken = getToken();
      if (!currentToken)
        throw new Error('Missing auth token after onboarding');
      signIn({ token: currentToken, user: validatedUser });
      clearOnboardingContext();
      clearDraftData();
      router.replace(getHomeRouteForRole(validatedUser.role));
    }
    catch (error) {
      if (!knownPhone)
        setDraftData({ phone: enteredPhone ?? undefined });
      const msg = getApiErrorMessage(error, t('auth.onboarding.genericError'));
      setErrorMsg(msg);
    }
    finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.paper, paddingTop: insets.top }}>
      <StatusBar style="dark" translucent />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <OnboardingHero isRTL={isRTL} />

          {/* Body */}
          <View style={{ paddingHorizontal: 24, marginTop: 24, flex: 1, gap: 14 }}>
            {errorMsg
              ? (
                  <Text
                    style={{
                      color: colors.semantic.absent,
                      fontSize: 13,
                      fontWeight: '600',
                      textAlign: 'center',
                    }}
                    testID="onboarding-error"
                  >
                    {errorMsg}
                  </Text>
                )
              : null}

            {showRoleSelector && (
              <RolePillRow
                isRTL={isRTL}
                selectedRole={selectedRole}
                onSelect={setSelectedRole}
              />
            )}

            <FullNameField isRTL={isRTL} value={fullName} onChangeText={setFullName} />

            {/* Phone (paper variant — keep PhoneField) */}
            {!knownPhone && !isResolvingKnownPhone && (
              <PhoneField
                label={t('auth.onboarding.phoneLabel')}
                countryCode={phoneCountryCode}
                localNumber={phoneLocalNumber}
                onCountryCodeChange={setPhoneCountryCode}
                onLocalNumberChange={setPhoneLocalNumber}
                testIDPrefix="onboarding-phone"
              />
            )}

            {/* Spacer */}
            <View style={{ flex: 1, minHeight: 16 }} />

            {/* Submit */}
            <PressButton
              variant="gradient"
              size="lg"
              fullWidth
              loading={isSubmitting}
              onPress={() => void handleSubmit()}
              label={t('auth.onboarding.submit')}
              trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.white} />}
              testID="onboarding-submit-button"
            />

            <OnboardingLegalNote marginBottom={Math.max(insets.bottom, 12)} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
