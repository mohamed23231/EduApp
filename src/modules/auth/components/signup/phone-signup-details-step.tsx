import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { AuthFieldShell, AuthInput, Icon, PressButton } from '@/components/ui';
import colors from '@/components/ui/colors';
import { UserRole } from '@/core/auth/roles';
import { RolePill } from './role-pill';

/**
 * Final "details" step of the phone signup flow: role row + name + password +
 * optional email + submit. Extracted from `phone-signup-form.tsx` to keep that
 * file under the 300-line cap.
 */

const ROLE_OPTIONS: Array<{
  value: UserRole.TEACHER | UserRole.PARENT | UserRole.MANAGER;
  labelKey: 'auth.signup.teacherLabel' | 'auth.signup.parentLabel' | 'auth.signup.managerLabel';
  icon: 'graduationCap' | 'users' | 'building';
}> = [
  { value: UserRole.TEACHER, labelKey: 'auth.signup.teacherLabel', icon: 'graduationCap' },
  { value: UserRole.PARENT, labelKey: 'auth.signup.parentLabel', icon: 'users' },
  { value: UserRole.MANAGER, labelKey: 'auth.signup.managerLabel', icon: 'building' },
];

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
      <View>
        <Text
          style={{
            color: colors.neutral.dim,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            marginBottom: 8,
            marginStart: 2,
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
          }}
        >
          {t('auth.signup.roleLabel')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {ROLE_OPTIONS.map(option => (
            <RolePill
              key={option.value}
              selected={role === option.value}
              label={t(option.labelKey)}
              iconName={option.icon}
              onPress={() => onRoleChange(option.value)}
              testID={`phone-signup-role-${option.value.toLowerCase()}`}
            />
          ))}
        </View>
      </View>

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
