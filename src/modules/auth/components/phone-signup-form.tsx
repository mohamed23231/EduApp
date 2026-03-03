import type { PhoneOtpPurpose, PhoneSignupParams } from '../types';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Eye, EyeOff } from '@/components/ui/icons';
import { UserRole } from '@/core/auth/roles';

type SignupStep = 'phone' | 'otp' | 'details';

export type PhoneSignupFormProps = {
  onSubmit: (data: PhoneSignupParams) => void;
  onOtpRequest: (phone: string, purpose: PhoneOtpPurpose) => void;
  isSubmitting: boolean;
  isRequestingOtp: boolean;
  error?: string | null;
  otpSent?: boolean;
};

// eslint-disable-next-line max-lines-per-function
export function PhoneSignupForm({
  onSubmit,
  onOtpRequest,
  isSubmitting,
  isRequestingOtp,
  error,
  otpSent: _otpSent = false,
}: PhoneSignupFormProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);
  const [step, setStep] = React.useState<SignupStep>('phone');
  const [phone, setPhone] = React.useState('');

  const form = useForm({
    defaultValues: {
      phone: '',
      otp: '',
      password: '',
      fullName: '',
      email: '',
      role: UserRole.PARENT,
    },
    onSubmit: async ({ value }) => {
      onSubmit({
        phone: value.phone,
        otp: value.otp,
        password: value.password,
        role: value.role,
        fullName: value.fullName,
        email: value.email || undefined,
      });
    },
  });

  const handleRequestOtp = async () => {
    const phoneValue = form.state.values.phone?.trim() ?? '';
    if (!phoneValue)
      return;
    setPhone(phoneValue);
    await onOtpRequest(phoneValue, 'SIGNUP');
    setStep('otp');
  };

  const handleVerifyOtp = () => {
    const otpValue = form.state.values.otp?.trim() ?? '';
    if (!otpValue)
      return;
    setStep('details');
  };

  const renderPhoneStep = () => (
    <View style={styles.formBlock}>
      <Text style={styles.label}>{t('auth.phone.phoneLabel')}</Text>
      <TextInput
        value={form.state.values.phone}
        onChangeText={value => form.setFieldValue('phone', value)}
        autoCapitalize="none"
        keyboardType="phone-pad"
        autoCorrect={false}
        placeholder="+966 5X XXX XXXX"
        placeholderTextColor="#94A3B8"
        testID="phone-input"
        style={styles.input}
      />
      <Pressable
        style={[
          styles.secondaryButton,
          isRequestingOtp && styles.secondaryButtonDisabled,
        ]}
        onPress={handleRequestOtp}
        disabled={isRequestingOtp || !form.state.values.phone}
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
        value={form.state.values.otp}
        onChangeText={value => form.setFieldValue('otp', value)}
        keyboardType="number-pad"
        autoCorrect={false}
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
        onPress={handleRequestOtp}
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
        style={styles.verifyButton}
        onPress={handleVerifyOtp}
        disabled={!form.state.values.otp || form.state.values.otp.length !== 6}
      >
        <Text style={styles.verifyButtonLabel}>
          {t('auth.phone.verifyOtp')}
        </Text>
      </Pressable>
    </View>
  );

  const renderDetailsStep = () => (
    <>
      <View style={styles.formBlock}>
        <Text style={styles.label}>{t('auth.phone.fullNameLabel')}</Text>
        <TextInput
          value={form.state.values.fullName}
          onChangeText={value => form.setFieldValue('fullName', value)}
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
            value={form.state.values.password}
            onChangeText={value => form.setFieldValue('password', value)}
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
          value={form.state.values.email}
          onChangeText={value => form.setFieldValue('email', value)}
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

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.apiError}>{error}</Text> : null}

      {step === 'phone' && renderPhoneStep()}
      {step === 'otp' && renderOtpStep()}
      {step === 'details' && renderDetailsStep()}

      {step === 'details' && (
        <form.Subscribe
          selector={state => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, validating]) => (
            <Pressable
              style={[
                styles.submitButton,
                (!canSubmit || isSubmitting || validating) && styles.submitButtonDisabled,
              ]}
              onPress={() => void form.handleSubmit()}
              disabled={!canSubmit || isSubmitting || validating}
              testID="phone-signup-submit-button"
            >
              {isSubmitting || validating
                ? <ActivityIndicator color="#FFFFFF" />
                : (
                    <Text style={styles.submitButtonLabel}>
                      {t('auth.phone.signupButton')}
                    </Text>
                  )}
            </Pressable>
          )}
        />
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
  verifyButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 12,
  },
  verifyButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
