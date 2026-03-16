import type { PhoneResetPasswordConfirmParams, PhoneResetPasswordRequestParams } from '@modules/auth/types';
import { AuthButton, AuthInput, OtpInput } from '@modules/auth/components/ui';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  Text,
  View,
} from 'react-native';
import { PhoneField } from '@/components/ui';
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
    <View className="w-full">
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
      <View className="w-full gap-3">
        <Text className="text-center text-sm text-gray-500">
          {t('auth.phone.otpSentHint', { phone })}
        </Text>
        <form.Field
          name="otp"
          children={field => (
            <OtpInput
              value={normalizeOtp(field.state.value)}
              onChange={(value) => {
                field.handleChange(normalizeOtp(value));
              }}
            />
          )}
        />
        <Pressable
          className={`h-[44px] items-center justify-center rounded-xl border border-blue-500 bg-white${isSubmitting ? 'opacity-50' : ''}`}
          onPress={() => void handleResendOtp()}
          disabled={isSubmitting}
        >
          <Text className="text-sm font-semibold text-blue-500">
            {t('auth.phone.resendOtp')}
          </Text>
        </Pressable>
      </View>

      <View className="w-full">
        <form.Field
          name="newPassword"
          children={field => (
            <AuthInput
              label={t('auth.phone.newPasswordLabel')}
              isPassword
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              autoCorrect={false}
              testID="password-input"
            />
          )}
        />
      </View>
    </>
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

      {step === 'request' && renderRequestStep()}
      {step === 'confirm' && renderConfirmStep()}

      <form.Subscribe
        selector={state => [state.canSubmit, state.isSubmitting] as const}
        children={([canSubmit, validating]) => (
          <AuthButton
            title={step === 'request'
              ? t('auth.phone.requestOtp')
              : t('auth.phone.resetPasswordButton')}
            variant="blue"
            onPress={() => void form.handleSubmit()}
            disabled={!canSubmit || isSubmitting || validating}
            loading={isSubmitting || validating}
          />
        )}
      />
    </View>
  );
}
