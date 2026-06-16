import type {
  PhoneOtpPurpose,
  PhoneSignupParams,
  PhoneSignupVerifyParams,
  PhoneSignupVerifyResponse,
} from '../types';
import type { UserRole } from '@/core/auth/roles';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import {
  AuthFieldShell,
  AuthInput,
  Icon,
  PressButton,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { useModal } from '@/components/ui/modal';
import {
  buildE164Phone,
  DEFAULT_COUNTRY_CODE,
  getPhoneValidationErrorKey,
  sanitizeOtpCode,
} from '@/shared/utils/phone';
import { FormErrorText } from './auth-error-text';
import { CountryCodeChip } from './phone/country-code-chip';
import { CountryPickerSheet } from './phone/country-picker-sheet';
import { OtpCells } from './phone/otp-cells';
import { PhoneSignupDetailsStep } from './signup/phone-signup-details-step';

/**
 * PhoneSignupForm — dark identity per `contracts/visual-auth.md`.
 * Three-step flow inside the same dark shell: phone → OTP cells → details.
 */

type SignupStep = 'phone' | 'otp' | 'details';

export type PhoneSignupFormProps = {
  onSubmit: (data: PhoneSignupParams) => void;
  onOtpRequest: (phone: string, purpose: PhoneOtpPurpose) => Promise<void>;
  onOtpVerify: (data: PhoneSignupVerifyParams) => Promise<PhoneSignupVerifyResponse>;
  isSubmitting: boolean;
  isRequestingOtp: boolean;
  isVerifyingOtp?: boolean;
  error?: string | null;
};

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
  const [clientError, setClientError] = React.useState<string | null>(null);

  const countryPickerModal = useModal();
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
      <FormErrorText message={errorMsg} />

      {step === 'phone' && (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <CountryCodeChip
              dialCode={phoneCountryCode}
              onPress={() => countryPickerModal.present()}
              testID="phone-signup-country-chip"
            />
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
            trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.white} />}
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
            trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.white} />}
            testID="phone-signup-otp-verify-button"
          />
        </View>
      )}

      {step === 'details' && (
        <PhoneSignupDetailsStep
          isRTL={isRTL}
          isSubmitting={isSubmitting}
          role={role}
          fullName={fullName}
          password={password}
          email={email}
          otpLength={otp.length}
          onRoleChange={(value) => {
            setRole(value);
            setClientError(null);
          }}
          onFullNameChange={(value) => {
            setFullName(value);
            setClientError(null);
          }}
          onPasswordChange={(value) => {
            setPassword(value);
            setClientError(null);
          }}
          onEmailChange={(value) => {
            setEmail(value);
            setClientError(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      <CountryPickerSheet
        modalRef={countryPickerModal.ref}
        selectedDialCode={phoneCountryCode}
        onSelect={(dialCode) => {
          setPhoneCountryCode(dialCode);
          countryPickerModal.dismiss();
        }}
        testIDPrefix="phone-signup-country"
      />
    </View>
  );
}
