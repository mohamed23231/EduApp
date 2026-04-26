import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GradientText,
  Icon,
  PhoneField,
  PressButton,
  TabaMark,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { UserRole } from '@/core/auth/roles';
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

/**
 * OnboardingScreen — paper canvas variant per `contracts/visual-auth.md` §153.
 * The ONE auth surface that intentionally breaks the dark shell pattern: the
 * shift to paper signals "you're inside now" after OTP verification.
 *
 * Visual: paper background, ink hero ("Tell us about you" + gradient second
 * line), role pill row (ink variant), paper-card fields, gradient CTA.
 */

type Role = UserRole.TEACHER | UserRole.PARENT;
const ROLE_OPTIONS: Array<{ value: Role; labelKey: string; icon: 'graduationCap' | 'users' }> = [
  { value: UserRole.TEACHER, labelKey: 'auth.signup.teacherLabel', icon: 'graduationCap' },
  { value: UserRole.PARENT, labelKey: 'auth.signup.parentLabel', icon: 'users' },
];

function getJwtExpiry(accessToken: string): number | null {
  const parts = accessToken.split('.');
  if (parts.length < 2)
    return null;
  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
  try {
    if (typeof globalThis.atob !== 'function')
      return null;
    const payload = JSON.parse(globalThis.atob(padded)) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : null;
  }
  catch {
    return null;
  }
}

function isProfileAlreadyExistsError(error: unknown): boolean {
  if (!isApiError(error))
    return false;
  const status = error.response?.status;
  const data = error.response?.data as Record<string, unknown> | undefined;
  const normalize = (value: unknown): string => {
    if (typeof value === 'string')
      return value.toLowerCase();
    if (Array.isArray(value))
      return value.filter((item): item is string => typeof item === 'string').join(' ').toLowerCase();
    if (value && typeof value === 'object' && 'message' in (value as Record<string, unknown>))
      return normalize((value as Record<string, unknown>).message);
    return '';
  };
  const normalizedMessage = [
    normalize(data?.message),
    normalize(data?.error),
    normalize((error as { message?: unknown }).message),
  ].filter(Boolean).join(' ');
  return (status === 400 || status === 409)
    && (normalizedMessage.includes('profile already exists')
      || normalizedMessage.includes('الملف الشخصي موجود'));
}

type RolePillProps = {
  selected: boolean;
  label: string;
  iconName: 'graduationCap' | 'users';
  onPress: () => void;
  testID?: string;
};

function RolePillInk({ selected, label, iconName, onPress, testID }: RolePillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      testID={testID}
      style={({ pressed }) => ({
        flex: 1,
        height: 64,
        borderRadius: 16,
        paddingHorizontal: 8,
        backgroundColor: selected
          ? 'rgba(34,197,114,0.10)'
          : pressed
            ? colors.neutral.cardWarm
            : colors.neutral.card,
        borderWidth: 1.5,
        borderColor: selected ? colors.brand.primary : colors.neutral.rule,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      })}
    >
      <Icon
        name={iconName}
        size={20}
        color={selected ? colors.brand.primary : colors.neutral.inkMuted}
      />
      <Text
        style={{
          color: selected ? colors.neutral.ink : colors.neutral.inkSoft,
          fontSize: 12,
          fontWeight: '700',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

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
          {/* Top bar — small ink mark */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <TabaMark size={48} frame="ink" />
          </View>

          {/* Hero */}
          <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
            <Text
              style={{
                color: colors.neutral.ink,
                fontSize: 30,
                lineHeight: 34,
                fontWeight: '700',
                letterSpacing: -1,
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              }}
            >
              {t('auth.onboarding.heroLine1', 'Tell us')}
            </Text>
            <View style={{ marginTop: 2, alignSelf: isRTL ? 'flex-end' : 'flex-start' }}>
              <GradientText size={30} weight="700">
                {t('auth.onboarding.heroLine2', 'about you.')}
              </GradientText>
            </View>
            <Text
              style={{
                color: colors.neutral.inkMuted,
                fontSize: 14,
                lineHeight: 22,
                fontWeight: '500',
                marginTop: 12,
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              }}
            >
              {t('auth.onboarding.subheadline', 'A few details to set up your profile.')}
            </Text>
          </View>

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

            {/* Role pill row (ink variant) */}
            {showRoleSelector && (
              <View>
                <Text
                  style={{
                    color: colors.neutral.inkMuted,
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                    marginBottom: 8,
                    marginStart: 2,
                    textAlign: isRTL ? 'right' : 'left',
                    writingDirection: isRTL ? 'rtl' : 'ltr',
                  }}
                >
                  {t('auth.signup.roleLabel')}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {ROLE_OPTIONS.map(option => (
                    <RolePillInk
                      key={option.value}
                      selected={selectedRole === option.value}
                      label={t(option.labelKey)}
                      iconName={option.icon}
                      onPress={() => setSelectedRole(option.value)}
                      testID={`role-card-${option.value.toLowerCase()}`}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Full name */}
            <View
              style={{
                height: 56,
                borderRadius: 16,
                paddingHorizontal: 16,
                backgroundColor: colors.neutral.card,
                borderWidth: 1.5,
                borderColor: colors.neutral.rule,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                autoCorrect={false}
                placeholder={t('auth.signup.fullNamePlaceholder')}
                placeholderTextColor={colors.neutral.inkMuted}
                testID="fullName-input"
                style={{
                  flex: 1,
                  color: colors.neutral.ink,
                  fontSize: 16,
                  fontWeight: '600',
                  padding: 0,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              />
            </View>

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

            <Text
              style={{
                color: colors.neutral.inkMuted,
                fontSize: 11,
                lineHeight: 16,
                fontWeight: '500',
                textAlign: 'center',
                marginTop: 6,
                marginBottom: Math.max(insets.bottom, 12),
              }}
            >
              {t('auth.login.legalLine', 'By continuing you agree to Taba3ny\'s Terms and Privacy Policy.')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
