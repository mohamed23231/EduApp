import type { PhoneResetPasswordConfirmParams, PhoneResetPasswordRequestParams } from '../types';
import { useForm } from '@tanstack/react-form';
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
import { getApiErrorMessage } from '@/shared/services/api-utils';
import {
  buildE164Phone,
  DEFAULT_COUNTRY_CODE,
  getPhoneValidationErrorKey,
  sanitizeOtpCode,
} from '@/shared/utils/phone';

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
  const [phone, setPhone] = React.useState(''); // normalized E.164
  const [phoneCountryCode, setPhoneCountryCode] = React.useState(DEFAULT_COUNTRY_CODE);
  const [phoneLocalNumber, setPhoneLocalNumber] = React.useState('');
  const [clientError, setClientError] = React.useState<string | null>(null);
  const [step, setStep] = React.useState<ResetStep>('request');

  const normalizeOtp = React.useCallback((value: string) => {
    return sanitizeOtpCode(value, 6);
  }, []);

  const translateApiError = React.useCallback(
    (err: unknown) => getApiErrorMessage(
      err,
      t('auth.reset_password.error'),
      code => t(`auth.errors.${code}`, { defaultValue: '' }),
    ),
    [t],
  );

  const form = useForm({
    defaultValues: {
      phone: '',
      otp: '',
      newPassword: '',
    },
    onSubmit: async ({ value }) => {
      try {
        if (step === 'request') {
          const normalizedPhone = buildE164Phone(phoneCountryCode, phoneLocalNumber);
          if (!normalizedPhone) {
            setClientError(getPhoneValidationErrorKey(phoneCountryCode));
            return;
          }
          setClientError(null);
          setPhone(normalizedPhone);
          await onRequest({ phone: normalizedPhone });
          setStep('confirm');
          return;
        }

        setClientError(null);
        await onConfirm({
          phone,
          otp: value.otp?.trim() ?? '',
          newPassword: value.newPassword?.trim() ?? '',
        });
      }
      catch (err) {
        setClientError(translateApiError(err));
      }
    },
  });

  const handleResendOtp = async () => {
    if (!phone || isSubmitting) {
      return;
    }
    try {
      setClientError(null);
      await onRequest({ phone });
    }
    catch (err) {
      setClientError(translateApiError(err));
    }
  };

  const renderRequestStep = () => (
    <View style={styles.formBlock}>
      <PhoneField
        label={t('auth.phone.phoneLabel')}
        countryCode={phoneCountryCode}
        localNumber={phoneLocalNumber}
        onCountryCodeChange={setPhoneCountryCode}
        onLocalNumberChange={setPhoneLocalNumber}
        error={clientError ?? undefined}
        testIDPrefix="phone-reset"
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
        <form.Field
          name="otp"
          children={field => (
            <TextInput
              value={field.state.value}
              onChangeText={value => field.handleChange(normalizeOtp(value))}
              onBlur={field.handleBlur}
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
          )}
        />
        <Pressable
          style={[styles.secondaryButton, isSubmitting && styles.secondaryButtonDisabled]}
          onPress={() => void handleResendOtp()}
          disabled={isSubmitting}
        >
          <Text style={styles.secondaryButtonLabel}>{t('auth.phone.resendOtp')}</Text>
        </Pressable>
      </View>

      <View style={styles.formBlock}>
        <Text style={styles.label}>{t('auth.phone.newPasswordLabel')}</Text>
        <View style={styles.passwordInputWrapper}>
          <form.Field
            name="newPassword"
            children={field => (
              <TextInput
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                secureTextEntry={!showPassword}
                autoCorrect={false}
                testID="password-input"
                style={[
                  styles.input,
                  styles.passwordInput,
                ]}
              />
            )}
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
      {(clientError || error)
        ? (
            <Text style={styles.apiError}>
              {t(clientError || error || '', { defaultValue: clientError || error || '' })}
            </Text>
          )
        : null}

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
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#2563EB',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 10,
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
});
