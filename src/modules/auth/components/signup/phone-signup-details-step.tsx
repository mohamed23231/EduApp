import type { UserRole } from '@/core/auth/roles';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { AuthFieldShell, AuthInput, Icon, PressButton } from '@/components/ui';
import colors from '@/components/ui/colors';
import { PhoneSignupRoleRow } from './phone-signup-role-row';

/**
 * Final "details" step of the phone signup flow: role row + name + password +
 * optional email + submit. Extracted from `phone-signup-form.tsx` to keep that
 * file under the 300-line cap.
 */

export type PhoneSignupDetailsStepProps = {
  isRTL: boolean;
  isSubmitting: boolean;
  role: UserRole | '';
  fullName: string;
  password: string;
  email: string;
  otpLength: number;
  onRoleChange: (value: UserRole) => void;
  onFullNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
};

export function PhoneSignupDetailsStep({
  isRTL,
  isSubmitting,
  role,
  fullName,
  password,
  email,
  otpLength,
  onRoleChange,
  onFullNameChange,
  onPasswordChange,
  onEmailChange,
  onSubmit,
}: PhoneSignupDetailsStepProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);
  const submitDisabled = !role || !fullName.trim() || password.length < 8 || otpLength !== 6;

  return (
    <View style={{ gap: 14 }}>
      <PhoneSignupRoleRow isRTL={isRTL} role={role} onRoleChange={onRoleChange} />

      <AuthFieldShell>
        <AuthInput
          value={fullName}
          onChangeText={onFullNameChange}
          placeholder={t('auth.phone.fullNameLabel')}
          autoCapitalize="words"
          testID="phone-signup-fullname-input"
          textAlign={isRTL ? 'right' : 'left'}
          fontSize={16}
          letterSpacing={0}
        />
      </AuthFieldShell>

      <AuthFieldShell>
        <AuthInput
          value={password}
          onChangeText={onPasswordChange}
          placeholder={t('auth.phone.passwordLabel')}
          secureTextEntry={!showPassword}
          testID="phone-signup-password-input"
          textAlign={isRTL ? 'right' : 'left'}
          fontSize={16}
          letterSpacing={0}
        />
        <Pressable
          onPress={() => setShowPassword(s => !s)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ marginStart: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t(
            showPassword ? 'auth.login.hidePassword' : 'auth.login.showPassword',
            showPassword ? 'Hide password' : 'Show password',
          )}
        >
          <Icon name={showPassword ? 'eyeOff' : 'eye'} size={20} color={colors.neutral.dim} />
        </Pressable>
      </AuthFieldShell>

      <AuthFieldShell>
        <AuthInput
          value={email}
          onChangeText={onEmailChange}
          placeholder={t('auth.phone.emailOptionalPlaceholder', 'Email (optional)')}
          keyboardType="email-address"
          testID="phone-signup-email-input"
          textAlign={isRTL ? 'right' : 'left'}
          fontSize={16}
          letterSpacing={0}
        />
      </AuthFieldShell>

      <PressButton
        variant="gradient"
        size="lg"
        fullWidth
        loading={isSubmitting}
        disabled={submitDisabled}
        onPress={onSubmit}
        label={t('auth.phone.signupButton')}
        trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.white} />}
        testID="phone-signup-submit-button"
      />
    </View>
  );
}
