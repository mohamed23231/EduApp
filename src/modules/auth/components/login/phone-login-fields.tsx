import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { AuthFieldShell, AuthInput, Icon, PressButton } from '@/components/ui';
import colors from '@/components/ui/colors';
import { CountryCodeChip } from '../phone/country-code-chip';

/**
 * Phone + password fields for the login form (password-login model). Pure
 * useState, so it types cleanly without the TanStack form generics. Extracted
 * from `login-form.tsx` to keep that file under the 300-line cap.
 */

export type PhoneLoginFieldsProps = {
  isRTL: boolean;
  isSubmitting: boolean;
  dialCode: string;
  localNumber: string;
  password: string;
  canContinue: boolean;
  onOpenCountryPicker: () => void;
  onLocalNumberChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onForgotPassword: () => void;
  onContinue: () => void;
};

export function PhoneLoginFields({
  isRTL,
  isSubmitting,
  dialCode,
  localNumber,
  password,
  canContinue,
  onOpenCountryPicker,
  onLocalNumberChange,
  onPasswordChange,
  onForgotPassword,
  onContinue,
}: PhoneLoginFieldsProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <CountryCodeChip dialCode={dialCode} onPress={onOpenCountryPicker} testID="login-country-chip" />
        <AuthFieldShell>
          <AuthInput
            value={localNumber}
            onChangeText={onLocalNumberChange}
            placeholder={t('auth.phone.localPlaceholder', '1XX XXX XXXX')}
            keyboardType="phone-pad"
            testID="login-phone-input"
            textAlign={isRTL ? 'right' : 'left'}
          />
        </AuthFieldShell>
      </View>

      <AuthFieldShell>
        <AuthInput
          value={password}
          onChangeText={onPasswordChange}
          placeholder={t('auth.phone.passwordLabel', 'Password')}
          secureTextEntry={!showPassword}
          testID="phone-password-input"
          textAlign={isRTL ? 'right' : 'left'}
          fontSize={16}
          letterSpacing={0}
        />
        <Pressable
          onPress={() => setShowPassword(s => !s)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ marginStart: 8 }}
        >
          <Icon name={showPassword ? 'eyeOff' : 'eye'} size={20} color={colors.neutral.dim} />
        </Pressable>
      </AuthFieldShell>

      <Pressable
        onPress={onForgotPassword}
        style={{ alignSelf: isRTL ? 'flex-start' : 'flex-end', paddingVertical: 4 }}
      >
        <Text style={{ color: colors.neutral.dim, fontSize: 13, fontWeight: '600' }}>
          {t('auth.login.forgotPassword')}
        </Text>
      </Pressable>

      <PressButton
        variant="gradient"
        size="lg"
        fullWidth
        loading={isSubmitting}
        disabled={!canContinue}
        onPress={onContinue}
        label={t('auth.login.submit', 'Continue')}
        trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.white} />}
        testID="phone-login-submit-button"
      />
    </View>
  );
}
