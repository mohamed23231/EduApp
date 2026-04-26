import type {
  PhoneOtpPurpose,
  PhoneSignupParams,
  PhoneSignupVerifyParams,
  PhoneSignupVerifyResponse,
} from '../types';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, Text, View } from 'react-native';
import {
  AuthFieldShell,
  AuthInput,
  Icon,
  isoToFlagEmoji,
  PressButton,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { Modal, useModal } from '@/components/ui/modal';
import { UserRole } from '@/core/auth/roles';
import {
  buildE164Phone,
  DEFAULT_COUNTRY_CODE,
  getPhoneCountryByDialCode,
  getPhoneValidationErrorKey,
  getSupportedPhoneCountries,
  sanitizeOtpCode,
} from '@/shared/utils/phone';

/**
 * PhoneSignupForm — dark identity per `contracts/visual-auth.md`.
 * Three-step flow inside the same dark shell: phone → OTP cells → details.
 */

type SignupStep = 'phone' | 'otp' | 'details';

const ROLE_OPTIONS: Array<{
  value: UserRole.TEACHER | UserRole.PARENT | UserRole.MANAGER;
  labelKey: 'auth.signup.teacherLabel' | 'auth.signup.parentLabel' | 'auth.signup.managerLabel';
  icon: 'graduationCap' | 'users' | 'building';
}> = [
  { value: UserRole.TEACHER, labelKey: 'auth.signup.teacherLabel', icon: 'graduationCap' },
  { value: UserRole.PARENT, labelKey: 'auth.signup.parentLabel', icon: 'users' },
  { value: UserRole.MANAGER, labelKey: 'auth.signup.managerLabel', icon: 'building' },
];

export type PhoneSignupFormProps = {
  onSubmit: (data: PhoneSignupParams) => void;
  onOtpRequest: (phone: string, purpose: PhoneOtpPurpose) => Promise<void>;
  onOtpVerify: (data: PhoneSignupVerifyParams) => Promise<PhoneSignupVerifyResponse>;
  isSubmitting: boolean;
  isRequestingOtp: boolean;
  isVerifyingOtp?: boolean;
  error?: string | null;
};

type RolePillProps = {
  selected: boolean;
  label: string;
  iconName: 'graduationCap' | 'users' | 'building';
  onPress: () => void;
  testID?: string;
};

function RolePill({ selected, label, iconName, onPress, testID }: RolePillProps) {
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
          ? 'rgba(34,197,114,0.16)'
          : pressed
            ? 'rgba(34,197,114,0.10)'
            : 'rgba(255,255,255,0.06)',
        borderWidth: 1.5,
        borderColor: selected ? colors.brand.primary : 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      })}
    >
      <Icon
        name={iconName}
        size={20}
        color={selected ? colors.brand.primary : colors.neutral.dim}
      />
      <Text
        style={{
          color: selected ? colors.neutral.white : colors.neutral.dim,
          fontSize: 12,
          fontWeight: '700',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type OtpCellsProps = {
  value: string;
  onChange: (value: string) => void;
  isRTL: boolean;
};

function OtpCells({ value, onChange, isRTL }: OtpCellsProps) {
  const cells = Array.from({ length: 6 }, (_, idx) => value[idx] ?? '');
  return (
    <View style={{ position: 'relative' }}>
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
        }}
      >
        {cells.map((char, idx) => {
          const filled = char.length > 0;
          return (
            <View
              // eslint-disable-next-line react/no-array-index-key
              key={idx}
              style={{
                width: 46,
                height: 60,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: filled
                  ? 'rgba(34,197,114,0.18)'
                  : 'rgba(255,255,255,0.06)',
                borderWidth: 1.5,
                borderColor: filled
                  ? colors.brand.primary
                  : 'rgba(255,255,255,0.15)',
              }}
            >
              <Text
                style={{
                  color: colors.neutral.white,
                  fontSize: 26,
                  fontWeight: '700',
                }}
              >
                {char}
              </Text>
            </View>
          );
        })}
      </View>
      {/* Hidden input that captures the OTP */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          start: 0,
          end: 0,
          bottom: 0,
          opacity: 0.01,
        }}
      >
        <AuthFieldShell>
          <AuthInput
            value={value}
            onChangeText={onChange}
            placeholder=""
            keyboardType={Platform.OS === 'ios' ? 'numeric' : 'numeric'}
            maxLength={6}
            autoFocus
            textContentType="oneTimeCode"
            testID="otp-input"
            textAlign={isRTL ? 'right' : 'left'}
          />
        </AuthFieldShell>
      </View>
    </View>
  );
}

// eslint-disable-next-line max-lines-per-function
export function PhoneSignupForm({
  onSubmit,
  onOtpRequest,
  onOtpVerify,
  isSubmitting,
  isRequestingOtp,
  isVerifyingOtp = false,
  error,
}: PhoneSignupFormProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [step, setStep] = React.useState<SignupStep>('phone');
  const [phoneCountryCode, setPhoneCountryCode] = React.useState(DEFAULT_COUNTRY_CODE);
  const [phoneLocalNumber, setPhoneLocalNumber] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [role, setRole] = React.useState<UserRole | ''>('');
  const [fullName, setFullName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [clientError, setClientError] = React.useState<string | null>(null);

  const countryPickerModal = useModal();
  const supportedCountries = React.useMemo(() => getSupportedPhoneCountries(), []);
  const phoneCountry = getPhoneCountryByDialCode(phoneCountryCode);
  const phoneFlag = isoToFlagEmoji(phoneCountry.iso2);
  const composedPhone = buildE164Phone(phoneCountryCode, phoneLocalNumber);

  const handleRequestOtp = async () => {
    if (!composedPhone) {
      setClientError(getPhoneValidationErrorKey(phoneCountryCode));
      return;
    }
    setClientError(null);
    setPhone(composedPhone);
    try {
      await onOtpRequest(composedPhone, 'SIGNUP');
      setStep('otp');
    }
    catch {
      // Parent screen surfaces API errors.
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6)
      return;
    const target = phone || composedPhone;
    if (!target) {
      setClientError(getPhoneValidationErrorKey(phoneCountryCode));
      return;
    }
    setClientError(null);
    try {
      const verification = await onOtpVerify({ phone: target, otp });
      if (verification.accountExists || !verification.canContinue) {
        setClientError('auth.phone.signupExistingAccount');
        return;
      }
      setStep('details');
    }
    catch {
      // Parent screen surfaces API errors.
    }
  };

  const handleSubmit = () => {
    if (!composedPhone) {
      setClientError(getPhoneValidationErrorKey(phoneCountryCode));
      return;
    }
    if (!role) {
      setClientError('auth.signup.validation.roleRequired');
      return;
    }
    if (!fullName.trim()) {
      setClientError('auth.signup.validation.fullNameRequired');
      return;
    }
    if (password.length < 8) {
      setClientError('auth.signup.validation.passwordTooShort');
      return;
    }
    setClientError(null);
    onSubmit({
      phone: composedPhone,
      otp: otp.trim(),
      password,
      role,
      fullName: fullName.trim(),
      email: email.trim() || undefined,
    });
  };

  const errorMsgRaw = clientError || error;
  const errorMsg = errorMsgRaw ? t(errorMsgRaw, { defaultValue: errorMsgRaw }) : null;

  return (
    <View style={{ gap: 14 }}>
      {errorMsg
        ? (
            <Text
              style={{
                color: colors.semantic.absent,
                fontSize: 13,
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              {errorMsg}
            </Text>
          )
        : null}

      {step === 'phone' && (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => countryPickerModal.present()}
              accessibilityRole="button"
              accessibilityLabel={t('auth.phone.countryCodeLabel', 'Country')}
              testID="phone-signup-country-chip"
              style={({ pressed }) => ({
                height: 56,
                borderRadius: 16,
                paddingHorizontal: 14,
                backgroundColor: pressed
                  ? 'rgba(34,197,114,0.30)'
                  : 'rgba(255,255,255,0.06)',
                borderWidth: 1.5,
                borderColor: pressed
                  ? colors.brand.primary
                  : 'rgba(255,255,255,0.12)',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              })}
            >
              <Text style={{ fontSize: 18 }}>{phoneFlag}</Text>
              <Text
                style={{
                  color: colors.neutral.white,
                  fontSize: 15,
                  fontWeight: '700',
                }}
              >
                {phoneCountryCode}
              </Text>
              <Text style={{ color: colors.neutral.dim, fontSize: 14, marginStart: 2 }}>
                ▾
              </Text>
            </Pressable>
            <AuthFieldShell>
              <AuthInput
                value={phoneLocalNumber}
                onChangeText={setPhoneLocalNumber}
                placeholder={t('auth.phone.localPlaceholder', '1XX XXX XXXX')}
                keyboardType="phone-pad"
                testID="phone-signup-input"
                textAlign={isRTL ? 'right' : 'left'}
              />
            </AuthFieldShell>
          </View>

          <Text
            style={{
              color: colors.neutral.inkMuted,
              fontSize: 12,
              fontWeight: '500',
              textAlign: 'center',
              marginTop: 2,
            }}
          >
            {t('auth.phone.signupFlowHint')}
          </Text>

          <PressButton
            variant="gradient"
            size="lg"
            fullWidth
            loading={isRequestingOtp}
            disabled={!composedPhone}
            onPress={() => void handleRequestOtp()}
            label={t('auth.phone.requestOtp')}
            trailingIcon={(
              <Icon
                name="arrowR"
                size={18}
                color={colors.neutral.white}
              />
            )}
            testID="phone-signup-otp-request-button"
          />
        </View>
      )}

      {step === 'otp' && (
        <View style={{ gap: 14 }}>
          <Text
            style={{
              color: colors.neutral.dim,
              fontSize: 13,
              fontWeight: '500',
              textAlign: 'center',
            }}
          >
            {t('auth.phone.otpSentHint', { phone })}
          </Text>

          <OtpCells value={otp} onChange={v => setOtp(sanitizeOtpCode(v, 6))} isRTL={isRTL} />

          <Pressable
            onPress={() => void handleRequestOtp()}
            disabled={isRequestingOtp}
            style={{ alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 12 }}
            testID="phone-signup-resend-button"
          >
            <Text
              style={{
                color: isRequestingOtp ? colors.neutral.inkMuted : colors.brand.primary,
                fontSize: 13,
                fontWeight: '700',
              }}
            >
              {t('auth.phone.resendOtp')}
            </Text>
          </Pressable>

          <PressButton
            variant="gradient"
            size="lg"
            fullWidth
            loading={isVerifyingOtp}
            disabled={otp.length !== 6}
            onPress={() => void handleVerifyOtp()}
            label={t('auth.phone.verifyOtp')}
            trailingIcon={(
              <Icon
                name="arrowR"
                size={18}
                color={colors.neutral.white}
              />
            )}
            testID="phone-signup-otp-verify-button"
          />
        </View>
      )}

      {step === 'details' && (
        <View style={{ gap: 14 }}>
          {/* Role pill row */}
          <View>
            <Text
              style={{
                color: colors.neutral.dim,
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
                <RolePill
                  key={option.value}
                  selected={role === option.value}
                  label={t(option.labelKey)}
                  iconName={option.icon}
                  onPress={() => {
                    setRole(option.value);
                    setClientError(null);
                  }}
                  testID={`phone-signup-role-${option.value.toLowerCase()}`}
                />
              ))}
            </View>
          </View>

          <AuthFieldShell>
            <AuthInput
              value={fullName}
              onChangeText={(v) => {
                setFullName(v);
                setClientError(null);
              }}
              placeholder={t('auth.phone.fullNameLabel')}
              autoCapitalize="words"
              testID="phone-signup-fullname-input"
              textAlign={isRTL ? 'right' : 'left'}
              fontSize={16}
              letterSpacing={0}
            />
          </AuthFieldShell>

          <AuthFieldShell>
            <AuthInput
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setClientError(null);
              }}
              placeholder={t('auth.phone.passwordLabel')}
              secureTextEntry={!showPassword}
              testID="phone-signup-password-input"
              textAlign={isRTL ? 'right' : 'left'}
              fontSize={16}
              letterSpacing={0}
            />
            <Pressable
              onPress={() => setShowPassword(s => !s)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ marginStart: 8 }}
            >
              <Icon
                name={showPassword ? 'eyeOff' : 'eye'}
                size={20}
                color={colors.neutral.dim}
              />
            </Pressable>
          </AuthFieldShell>

          <AuthFieldShell>
            <AuthInput
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setClientError(null);
              }}
              placeholder={t('auth.phone.emailOptionalPlaceholder', 'Email (optional)')}
              keyboardType="email-address"
              testID="phone-signup-email-input"
              textAlign={isRTL ? 'right' : 'left'}
              fontSize={16}
              letterSpacing={0}
            />
          </AuthFieldShell>

          <PressButton
            variant="gradient"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={
              !role
              || !fullName.trim()
              || password.length < 8
              || otp.length !== 6
            }
            onPress={handleSubmit}
            label={t('auth.phone.signupButton')}
            trailingIcon={(
              <Icon
                name="arrowR"
                size={18}
                color={colors.neutral.white}
              />
            )}
            testID="phone-signup-submit-button"
          />
        </View>
      )}

      {/* Country picker — same Modal+useModal pattern as login. */}
      <Modal
        ref={countryPickerModal.ref}
        snapPoints={['38%']}
        title={t('auth.phone.countryCodeLabel', 'Country')}
      >
        <View style={{ paddingHorizontal: 20, paddingBottom: 22, gap: 8 }}>
          {supportedCountries.map((country) => {
            const selected = country.dialCode === phoneCountryCode;
            const flag = isoToFlagEmoji(country.iso2);
            const label = t(`auth.phone.countries.${country.iso2.toLowerCase()}`, {
              dialCode: country.dialCode,
              defaultValue: `${country.iso2} (${country.dialCode})`,
            });
            return (
              <Pressable
                key={country.iso2}
                onPress={() => {
                  setPhoneCountryCode(country.dialCode);
                  countryPickerModal.dismiss();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                testID={`phone-signup-country-option-${country.iso2.toLowerCase()}`}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: selected
                    ? colors.brand.primaryGlow
                    : pressed
                      ? colors.neutral.paper
                      : 'transparent',
                })}
              >
                <Text style={{ fontSize: 24 }}>{flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.neutral.ink,
                      fontSize: 15,
                      fontWeight: '700',
                    }}
                  >
                    {label}
                  </Text>
                  <Text
                    style={{
                      color: colors.neutral.inkMuted,
                      fontSize: 13,
                      fontWeight: '500',
                      marginTop: 2,
                    }}
                  >
                    {country.dialCode}
                  </Text>
                </View>
                {selected
                  ? <Icon name="check" size={20} color={colors.brand.primary} />
                  : null}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </View>
  );
}
