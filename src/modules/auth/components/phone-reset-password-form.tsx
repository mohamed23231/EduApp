import type { PhoneResetPasswordConfirmParams, PhoneResetPasswordRequestParams } from '../types';
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

type ResetStep = 'request' | 'confirm';

export type PhoneResetPasswordFormProps = {
  onRequest: (data: PhoneResetPasswordRequestParams) => void;
  onConfirm: (data: PhoneResetPasswordConfirmParams) => void;
  isSubmitting: boolean;
  error?: string | null;
  otpSent?: boolean;
};

// eslint-disable-next-line max-lines-per-function
export function PhoneResetPasswordForm({
  onRequest,
  onConfirm,
  isSubmitting,
  error,
  otpSent: _otpSent = false,
}: PhoneResetPasswordFormProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);
  const [phone, setPhone] = React.useState('');
  const [step, setStep] = React.useState<ResetStep>('request');

  const form = useForm({
    defaultValues: {
      phone: '',
      otp: '',
      newPassword: '',
    },
    onSubmit: async ({ value }) => {
      if (step === 'request') {
        const phoneValue = value.phone?.trim() ?? '';
        if (!phoneValue)
          return;
        setPhone(phoneValue);
        await onRequest({ phone: phoneValue });
        setStep('confirm');
      }
      else {
        await onConfirm({
          phone,
          otp: value.otp?.trim() ?? '',
          newPassword: value.newPassword?.trim() ?? '',
        });
      }
    },
  });

  const renderRequestStep = () => (
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
    </View>
  );

  const renderConfirmStep = () => (
    <>
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
      </View>

      <View style={styles.formBlock}>
        <Text style={styles.label}>{t('auth.phone.newPasswordLabel')}</Text>
        <View style={styles.passwordInputWrapper}>
          <TextInput
            value={form.state.values.newPassword}
            onChangeText={value => form.setFieldValue('newPassword', value)}
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
    </>
  );

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.apiError}>{error}</Text> : null}

      {step === 'request' && renderRequestStep()}
      {step === 'confirm' && renderConfirmStep()}

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
            testID="phone-reset-submit-button"
          >
            {isSubmitting || validating
              ? <ActivityIndicator color="#FFFFFF" />
              : (
                  <Text style={styles.submitButtonLabel}>
                    {step === 'request'
                      ? t('auth.phone.requestOtp')
                      : t('auth.phone.resetPasswordButton')}
                  </Text>
                )}
          </Pressable>
        )}
      />
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
});
