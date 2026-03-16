import type {
  PhoneOtpPurpose,
  PhoneSignupParams,
  PhoneSignupVerifyParams,
  PhoneSignupVerifyResponse,
} from '@modules/auth/types';
import type { UserRole } from '@/core/auth/roles';
import { AuthButton, AuthInput, OtpInput, ROLE_OPTIONS, RoleCards } from '@modules/auth/components/ui';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  Text,
  View,
} from 'react-native';
import { PhoneField } from '@/components/ui';
import {
  buildE164Phone,
  DEFAULT_COUNTRY_CODE,
  getPhoneValidationErrorKey,
  sanitizeOtpCode,
} from '@/shared/utils/phone';

type SignupStep = 'phone' | 'otp' | 'details';

export type PhoneSignupFormProps = {
  onSubmit: (data: PhoneSignupParams) => void;
  onOtpRequest: (phone: string, purpose: PhoneOtpPurpose) => Promise<void>;
  onOtpVerify: (data: PhoneSignupVerifyParams) => Promise<PhoneSignupVerifyResponse>;
  isSubmitting: boolean;
  isRequestingOtp: boolean;
  isVerifyingOtp?: boolean;
  error?: string | null;
  otpSent?: boolean;
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
  otpSent: _otpSent = false,
}: PhoneSignupFormProps) {
  const { t } = useTranslation();
  const [step, setStep] = React.useState<SignupStep>('phone');
  const [phone, setPhone] = React.useState('');
  const [phoneCountryCode, setPhoneCountryCode] = React.useState(DEFAULT_COUNTRY_CODE);
  const [phoneLocalNumber, setPhoneLocalNumber] = React.useState('');
  const [clientError, setClientError] = React.useState<string | null>(null);

  const [otp, setOtp] = React.useState('');
  const [role, setRole] = React.useState<UserRole | ''>('');
  const [fullName, setFullName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [email, setEmail] = React.useState('');

  const normalizeOtp = React.useCallback((value: string) => {
    return sanitizeOtpCode(value, 6);
  }, []);

  const handleRequestOtp = async () => {
    const normalizedPhone = buildE164Phone(phoneCountryCode, phoneLocalNumber);
    if (!normalizedPhone) {
      setClientError(getPhoneValidationErrorKey(phoneCountryCode));
      return;
    }

    setClientError(null);
    setPhone(normalizedPhone);

    try {
      await onOtpRequest(normalizedPhone, 'SIGNUP');
      setStep('otp');
    }
    catch {
      // Parent screen surfaces API errors.
    }
  };

  const handleVerifyOtp = async () => {
    const normalizedPhone = phone || buildE164Phone(phoneCountryCode, phoneLocalNumber);
    if (!normalizedPhone) {
      setClientError(getPhoneValidationErrorKey(phoneCountryCode));
      return;
    }

    if (otp.length !== 6) {
      return;
    }

    setClientError(null);

    try {
      const verification = await onOtpVerify({ phone: normalizedPhone, otp });

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
    const normalizedPhone = buildE164Phone(phoneCountryCode, phoneLocalNumber);
    if (!normalizedPhone) {
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
      phone: normalizedPhone,
      otp: otp.trim(),
      password,
      role,
      fullName: fullName.trim(),
      email: email.trim() || undefined,
    });
  };

  const renderPhoneStep = () => (
    <View className="w-full gap-3">
      <PhoneField
        label={t('auth.phone.phoneLabel')}
        countryCode={phoneCountryCode}
        localNumber={phoneLocalNumber}
        onCountryCodeChange={setPhoneCountryCode}
        onLocalNumberChange={setPhoneLocalNumber}
        error={clientError ?? undefined}
        testIDPrefix="phone-signup"
      />
      <Text className="mt-2 text-center text-[13px] text-gray-500">
        {t('auth.phone.signupFlowHint')}
      </Text>
      <AuthButton
        title={t('auth.phone.requestOtp')}
        variant="black"
        onPress={() => void handleRequestOtp()}
        disabled={isRequestingOtp || !buildE164Phone(phoneCountryCode, phoneLocalNumber)}
        loading={isRequestingOtp}
      />
    </View>
  );

  const renderOtpStep = () => (
    <View className="w-full gap-3">
      <Text className="text-center text-sm text-gray-500">
        {t('auth.phone.otpSentHint', { phone })}
      </Text>
      <OtpInput
        value={otp}
        onChange={(value) => {
          setOtp(normalizeOtp(value));
          setClientError(null);
        }}
      />
      <Pressable
        className={`h-[44px] items-center justify-center rounded-xl border border-blue-500 bg-white${isRequestingOtp ? 'opacity-50' : ''}`}
        onPress={() => void handleRequestOtp()}
        disabled={isRequestingOtp}
      >
        {isRequestingOtp
          ? null
          : (
              <Text className="text-sm font-semibold text-blue-500">
                {t('auth.phone.resendOtp')}
              </Text>
            )}
      </Pressable>
      <AuthButton
        title={t('auth.phone.verifyOtp')}
        variant="black"
        onPress={() => void handleVerifyOtp()}
        disabled={otp.length !== 6 || isVerifyingOtp}
        loading={isVerifyingOtp}
      />
    </View>
  );

  const renderDetailsStep = () => (
    <>
      <RoleCards
        roles={[ROLE_OPTIONS.TEACHER, ROLE_OPTIONS.PARENT, ROLE_OPTIONS.MANAGER]}
        selected={role || null}
        onSelect={(value) => {
          setRole(value as UserRole);
          setClientError(null);
        }}
        overlineLabel={t('auth.signup.roleLabel')}
      />

      <View className="w-full">
        <AuthInput
          label={t('auth.phone.fullNameLabel')}
          value={fullName}
          onChangeText={(value) => {
            setFullName(value);
            setClientError(null);
          }}
          autoCapitalize="words"
          autoCorrect={false}
          placeholder="John Doe"
          placeholderTextColor="#94A3B8"
          testID="fullname-input"
        />
      </View>

      <View className="w-full">
        <AuthInput
          label={t('auth.phone.passwordLabel')}
          isPassword
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setClientError(null);
          }}
          autoCorrect={false}
          testID="password-input"
        />
      </View>

      <View className="w-full">
        <AuthInput
          label={`${t('auth.phone.emailLabel')} (${t('auth.common.optional')})`}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setClientError(null);
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          placeholder="name@example.com"
          placeholderTextColor="#94A3B8"
          testID="email-input"
        />
      </View>
    </>
  );

  const canSubmitDetails = Boolean(
    role
    && fullName.trim().length > 0
    && password.length >= 8
    && otp.length === 6,
  );

  return (
    <View className="gap-3.5">
      {(clientError || error)
        ? (
            <Text className="mb-3 text-center text-sm font-medium text-red-600">
              {t(clientError || error || '', { defaultValue: clientError || error || '' })}
            </Text>
          )
        : null}

      {step === 'phone' && renderPhoneStep()}
      {step === 'otp' && renderOtpStep()}
      {step === 'details' && renderDetailsStep()}

      {step === 'details' && (
        <AuthButton
          title={t('auth.phone.signupButton')}
          variant="black"
          onPress={() => handleSubmit()}
          disabled={!canSubmitDetails || isSubmitting}
          loading={isSubmitting}
        />
      )}
    </View>
  );
}
