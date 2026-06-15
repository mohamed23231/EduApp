import type { PhoneResetPasswordConfirmParams, PhoneResetPasswordRequestParams } from '../types';
import { useForm } from '@tanstack/react-form';
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
import { getApiErrorMessage } from '@/shared/services/api-utils';
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

/**
 * PhoneResetPasswordForm — dark identity per `contracts/visual-auth.md`.
 * Two-step flow inside one dark shell: request (phone) → confirm (OTP cells + new password).
 */

type ResetStep = 'request' | 'confirm';

export type PhoneResetPasswordFormProps = {
  onRequest: (data: PhoneResetPasswordRequestParams) => Promise<void> | void;
  onConfirm: (data: PhoneResetPasswordConfirmParams) => Promise<void> | void;
  isSubmitting: boolean;
  error?: string | null;
};

// eslint-disable-next-line max-lines-per-function
export function PhoneResetPasswordForm({
  onRequest,
  onConfirm,
  isSubmitting,
  error,
}: PhoneResetPasswordFormProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [step, setStep] = React.useState<ResetStep>('request');
  const [phone, setPhone] = React.useState('');
  const [phoneCountryCode, setPhoneCountryCode] = React.useState(DEFAULT_COUNTRY_CODE);
  const [phoneLocalNumber, setPhoneLocalNumber] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [clientError, setClientError] = React.useState<string | null>(null);

  const countryPickerModal = useModal();
  const composedPhone = buildE164Phone(phoneCountryCode, phoneLocalNumber);

  const translateApiError = React.useCallback(
    (err: unknown) => getApiErrorMessage(
      err,
      t('auth.reset_password.error'),
      code => t(`auth.errors.${code}`, { defaultValue: '' }),
    ),
    [t],
  );

  const form = useForm({
    defaultValues: { otp: '', newPassword: '' },
    onSubmit: async ({ value }) => {
      try {
        if (step === 'request') {
          if (!composedPhone) {
            setClientError(getPhoneValidationErrorKey(phoneCountryCode));
            return;
          }
          setClientError(null);
          setPhone(composedPhone);
          await onRequest({ phone: composedPhone });
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
    if (!phone || isSubmitting)
      return;
    try {
      setClientError(null);
      await onRequest({ phone });
    }
    catch (err) {
      setClientError(translateApiError(err));
    }
  };

  const errorMsgRaw = clientError || error;
  const errorMsg = errorMsgRaw ? t(errorMsgRaw, { defaultValue: errorMsgRaw }) : null;

  return (
    <View style={{ gap: 14 }}>
      <FormErrorText message={errorMsg} />

      {step === 'request' && (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <CountryCodeChip
              dialCode={phoneCountryCode}
              onPress={() => countryPickerModal.present()}
              testID="phone-reset-country-chip"
            />
            <AuthFieldShell>
              <AuthInput
                value={phoneLocalNumber}
                onChangeText={setPhoneLocalNumber}
                placeholder={t('auth.phone.localPlaceholder', '1XX XXX XXXX')}
                keyboardType="phone-pad"
                testID="phone-reset-input"
                textAlign={isRTL ? 'right' : 'left'}
              />
            </AuthFieldShell>
          </View>

          <PressButton
            variant="gradient"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={!composedPhone}
            onPress={() => void form.handleSubmit()}
            label={t('auth.phone.requestOtp')}
            trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.white} />}
            testID="phone-reset-request-button"
          />
        </View>
      )}

      {step === 'confirm' && (
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

          <form.Field
            name="otp"
            children={field => (
              <OtpCells
                value={field.state.value}
                onChange={v => field.handleChange(sanitizeOtpCode(v, 6))}
                isRTL={isRTL}
              />
            )}
          />

          <Pressable
            onPress={() => void handleResendOtp()}
            disabled={isSubmitting}
            style={{ alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 12 }}
            testID="phone-reset-resend-button"
          >
            <Text
              style={{
                color: isSubmitting ? colors.neutral.inkMuted : colors.brand.primary,
                fontSize: 13,
                fontWeight: '700',
              }}
            >
              {t('auth.phone.resendOtp')}
            </Text>
          </Pressable>

          <form.Field
            name="newPassword"
            children={field => (
              <AuthFieldShell>
                <AuthInput
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  placeholder={t('auth.phone.newPasswordLabel')}
                  secureTextEntry={!showPassword}
                  testID="phone-reset-password-input"
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
            )}
          />

          <PressButton
            variant="gradient"
            size="lg"
            fullWidth
            loading={isSubmitting}
            onPress={() => void form.handleSubmit()}
            label={t('auth.phone.resetPasswordButton')}
            trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.white} />}
            testID="phone-reset-confirm-button"
          />
        </View>
      )}

      <CountryPickerSheet
        modalRef={countryPickerModal.ref}
        selectedDialCode={phoneCountryCode}
        onSelect={(dialCode) => {
          setPhoneCountryCode(dialCode);
          countryPickerModal.dismiss();
        }}
        testIDPrefix="phone-reset-country"
      />
    </View>
  );
}
