import type { PhoneResetPasswordConfirmParams, PhoneResetPasswordRequestParams } from '../types';
import { useForm } from '@tanstack/react-form';
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
import { getApiErrorMessage } from '@/shared/services/api-utils';
import {
  buildE164Phone,
  DEFAULT_COUNTRY_CODE,
  getPhoneCountryByDialCode,
  getPhoneValidationErrorKey,
  getSupportedPhoneCountries,
  sanitizeOtpCode,
} from '@/shared/utils/phone';

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

type OtpCellsProps = {
  value: string;
  onChange: (value: string) => void;
  isRTL: boolean;
};

function OtpCells({ value, onChange, isRTL }: OtpCellsProps) {
  const cells = Array.from({ length: 6 }, (_, idx) => value[idx] ?? '');
  return (
    <View style={{ position: 'relative' }}>
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
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
              <Text style={{ color: colors.neutral.white, fontSize: 26, fontWeight: '700' }}>
                {char}
              </Text>
            </View>
          );
        })}
      </View>
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
            keyboardType="numeric"
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
  const supportedCountries = React.useMemo(() => getSupportedPhoneCountries(), []);
  const phoneCountry = getPhoneCountryByDialCode(phoneCountryCode);
  const phoneFlag = isoToFlagEmoji(phoneCountry.iso2);
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

      {step === 'request' && (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => countryPickerModal.present()}
              accessibilityRole="button"
              accessibilityLabel={t('auth.phone.countryCodeLabel', 'Country')}
              testID="phone-reset-country-chip"
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
              <Text style={{ color: colors.neutral.white, fontSize: 15, fontWeight: '700' }}>
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

      {/* Country picker — same Modal+useModal pattern as login/signup. */}
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
                testID={`phone-reset-country-option-${country.iso2.toLowerCase()}`}
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
                  <Text style={{ color: colors.neutral.ink, fontSize: 15, fontWeight: '700' }}>
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

      {/* Reference Platform once for clean import diff (formatter-stable) */}
      {Platform.OS === 'web' ? null : null}
    </View>
  );
}
