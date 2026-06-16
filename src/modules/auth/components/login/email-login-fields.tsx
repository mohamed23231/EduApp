import type { LoginFormValues } from '../../types';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { AuthFieldShell, AuthInput, Icon, PressButton } from '@/components/ui';
import colors from '@/components/ui/colors';
import { loginSchema } from '../../validators';
import { FieldErrorText } from '../auth-error-text';

/**
 * Email + password login fields. Owns its own TanStack form (validated by
 * `loginSchema`) so the parent never has to pass a generically-typed form
 * instance down — keeping `login-form.tsx` both small and `any`-free. The
 * parent receives the submitted values and the current email (for forgot-pw).
 */

export type EmailLoginFieldsProps = {
  isRTL: boolean;
  isSubmitting: boolean;
  onSubmit: (values: LoginFormValues) => void;
  onForgotPassword: (email: string) => void;
};

function fieldError(
  t: (key: string) => string,
  errors: unknown[],
): string | undefined {
  const first = errors[0];
  if (!first)
    return undefined;
  if (typeof first === 'string')
    return t(first);
  if (
    typeof first === 'object'
    && first !== null
    && 'message' in first
    && typeof (first as { message: unknown }).message === 'string'
  ) {
    return t((first as { message: string }).message);
  }
  return t('auth.login.genericError');
}

export function EmailLoginFields({
  isRTL,
  isSubmitting,
  onSubmit,
  onForgotPassword,
}: EmailLoginFieldsProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onChange: loginSchema as never },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <View style={{ gap: 12 }}>
      <form.Field
        name="email"
        children={(field) => {
          const hasError = field.state.meta.errors.length > 0;
          return (
            <View>
              <AuthFieldShell hasError={hasError}>
                <AuthInput
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  placeholder={t('auth.login.emailLabel', 'Email')}
                  keyboardType="email-address"
                  testID="email-input"
                  textAlign={isRTL ? 'right' : 'left'}
                  fontSize={16}
                  letterSpacing={0}
                />
              </AuthFieldShell>
              <FieldErrorText message={hasError ? fieldError(t, field.state.meta.errors) : null} />
            </View>
          );
        }}
      />

      <form.Field
        name="password"
        children={(field) => {
          const hasError = field.state.meta.errors.length > 0;
          return (
            <View>
              <AuthFieldShell hasError={hasError}>
                <AuthInput
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  placeholder={t('auth.login.passwordLabel', 'Password')}
                  secureTextEntry={!showPassword}
                  testID="password-input"
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
              <FieldErrorText message={hasError ? fieldError(t, field.state.meta.errors) : null} />
            </View>
          );
        }}
      />

      <Pressable
        onPress={() => onForgotPassword(form.state.values.email?.trim() ?? '')}
        style={{ alignSelf: isRTL ? 'flex-start' : 'flex-end', paddingVertical: 4 }}
      >
        <Text style={{ color: colors.neutral.dim, fontSize: 13, fontWeight: '600' }}>
          {t('auth.login.forgotPassword')}
        </Text>
      </Pressable>

      <form.Subscribe
        selector={state => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, validating]) => (
          <PressButton
            variant="gradient"
            size="lg"
            fullWidth
            loading={isSubmitting || (validating as boolean)}
            disabled={!canSubmit}
            onPress={() => void form.handleSubmit()}
            label={t('auth.login.submit', 'Continue')}
            trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.white} />}
            testID="login-submit-button"
          />
        )}
      />
    </View>
  );
}
