import type {
  PhoneOtpPurpose,
  PhoneSignupParams,
  PhoneSignupVerifyParams,
  PhoneSignupVerifyResponse,
} from '../types';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PhoneField } from '@/components/ui';
import { Eye, EyeOff } from '@/components/ui/icons';
import { UserRole } from '@/core/auth/roles';
import {
  buildE164Phone,
  DEFAULT_COUNTRY_CODE,
  getPhoneValidationErrorKey,
  sanitizeOtpCode,
} from '@/shared/utils/phone';

type SignupStep = 'phone' | 'otp' | 'details';

const ROLE_OPTIONS = [
  { value: UserRole.TEACHER, labelKey: 'auth.signup.teacherLabel', emoji: '👩‍🏫' },
  { value: UserRole.PARENT, labelKey: 'auth.signup.parentLabel', emoji: '👨‍👩‍👧' },
  { value: UserRole.MANAGER, labelKey: 'auth.signup.managerLabel', emoji: '🏢' },
] as const;

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
  const [showPassword, setShowPassword] = React.useState(false);
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
    <View style={styles.formBlock}>
      <PhoneField
        label={t('auth.phone.phoneLabel')}
        countryCode={phoneCountryCode}
        localNumber={phoneLocalNumber}
        onCountryCodeChange={setPhoneCountryCode}
        onLocalNumberChange={setPhoneLocalNumber}
        error={clientError ?? undefined}
        testIDPrefix="phone-signup"
      />
      <Text style={styles.stepHint}>{t('auth.phone.signupFlowHint')}</Text>
      <Pressable
        style={[
          styles.secondaryButton,
          isRequestingOtp && styles.secondaryButtonDisabled,
        ]}
        onPress={() => void handleRequestOtp()}
        disabled={isRequestingOtp || !buildE164Phone(phoneCountryCode, phoneLocalNumber)}
      >
        {isRequestingOtp
          ? <ActivityIndicator color="#2563EB" />
          : (
              <Text style={styles.secondaryButtonLabel}>
                {t('auth.phone.requestOtp')}
              </Text>
            )}
      </Pressable>
    </View>
  );

  const renderOtpStep = () => (
    <View style={styles.formBlock}>
      <Text style={styles.label}>{t('auth.phone.otpLabel')}</Text>
      <Text style={styles.otpHint}>
        {t('auth.phone.otpSentHint', { phone })}
      </Text>
      <TextInput
        value={otp}
        onChangeText={(value) => {
          setOtp(normalizeOtp(value));
          setClientError(null);
        }}
        keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
        autoFocus
        editable={!isSubmitting}
        autoCorrect={false}
        textContentType="oneTimeCode"
        placeholder="123456"
        placeholderTextColor="#94A3B8"
        maxLength={6}
        testID="otp-input"
        style={[styles.input, styles.otpInput]}
      />
      <Pressable
        style={[
          styles.secondaryButton,
          isRequestingOtp && styles.secondaryButtonDisabled,
        ]}
        onPress={() => void handleRequestOtp()}
        disabled={isRequestingOtp}
      >
        {isRequestingOtp
          ? <ActivityIndicator color="#2563EB" />
          : (
              <Text style={styles.secondaryButtonLabel}>
                {t('auth.phone.resendOtp')}
              </Text>
            )}
      </Pressable>
      <Pressable
        style={[
          styles.verifyButton,
          (otp.length !== 6 || isVerifyingOtp) && styles.verifyButtonDisabled,
        ]}
        onPress={() => void handleVerifyOtp()}
        disabled={otp.length !== 6 || isVerifyingOtp}
      >
        {isVerifyingOtp
          ? <ActivityIndicator color="#FFFFFF" />
          : (
              <Text style={styles.verifyButtonLabel}>
                {t('auth.phone.verifyOtp')}
              </Text>
            )}
      </Pressable>
    </View>
  );

  // eslint-disable-next-line max-lines-per-function
  const renderDetailsStep = () => (
    <>
      <View style={styles.formBlock}>
        <Text style={styles.roleLabel}>{t('auth.signup.roleLabel')}</Text>
        <View style={styles.roleCardsRow}>
          {ROLE_OPTIONS.map((option) => {
            const isSelected = role === option.value;
            return (
              <Pressable
                key={option.value}
                style={[styles.roleCard, isSelected && styles.roleCardSelected]}
                onPress={() => {
                  setRole(option.value);
                  setClientError(null);
                }}
                testID={`phone-signup-role-${option.value.toLowerCase()}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
              >
                <Text style={styles.roleAvatar}>{option.emoji}</Text>
                <Text style={[styles.roleCardLabel, isSelected && styles.roleCardLabelSelected]}>
                  {t(option.labelKey)}
                </Text>
                <View
                  style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.formBlock}>
        <Text style={styles.label}>{t('auth.phone.fullNameLabel')}</Text>
        <TextInput
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
          style={styles.input}
        />
      </View>

      <View style={styles.formBlock}>
        <Text style={styles.label}>{t('auth.phone.passwordLabel')}</Text>
        <View style={styles.passwordInputWrapper}>
          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setClientError(null);
            }}
            secureTextEntry={!showPassword}
            autoCorrect={false}
            testID="password-input"
            style={[
              styles.input,
              styles.passwordInput,
            ]}
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword
              ? <EyeOff width={20} height={20} color="#94A3B8" />
              : <Eye width={20} height={20} color="#94A3B8" />}
          </Pressable>
        </View>
      </View>

      <View style={styles.formBlock}>
        <Text style={styles.label}>
          {t('auth.phone.emailLabel')}
          {' '}
          (
          {t('auth.common.optional')}
          )
        </Text>
        <TextInput
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
          style={styles.input}
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
    <View style={styles.container}>
      {(clientError || error)
        ? (
            <Text style={styles.apiError}>
              {t(clientError || error || '', { defaultValue: clientError || error || '' })}
            </Text>
          )
        : null}

      {step === 'phone' && renderPhoneStep()}
      {step === 'otp' && renderOtpStep()}
      {step === 'details' && renderDetailsStep()}

      {step === 'details' && (
        <Pressable
          style={[
            styles.submitButton,
            (!canSubmitDetails || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={() => handleSubmit()}
          disabled={!canSubmitDetails || isSubmitting}
          testID="phone-signup-submit-button"
        >
          {isSubmitting
            ? <ActivityIndicator color="#FFFFFF" />
            : (
                <Text style={styles.submitButtonLabel}>
                  {t('auth.phone.signupButton')}
                </Text>
              )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  apiError: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  container: {
    gap: 14,
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
  otpInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
  },
  otpHint: {
    color: '#64748B',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  label: {
    color: '#334155',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  eyeButton: {
    padding: 4,
    position: 'absolute',
    right: 14,
    top: 14,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitButtonLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#2563EB',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 12,
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonLabel: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
  stepHint: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  roleCardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  roleAvatar: {
    fontSize: 36,
    marginBottom: 6,
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
  radioInner: {
    backgroundColor: '#2563EB',
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  roleCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 16,
    borderWidth: 2,
    flexBasis: '30%',
    flexGrow: 1,
    paddingVertical: 18,
  },
  roleCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  roleCardLabel: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '600',
  },
  roleCardLabelSelected: {
    color: '#2563EB',
  },
  verifyButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 12,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
