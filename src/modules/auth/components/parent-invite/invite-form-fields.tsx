import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { AuthFieldShell, AuthInput, Icon, PressButton } from '@/components/ui';
import colors from '@/components/ui/colors';
import { inviteAcceptSchema } from '../../validators';
import { FieldErrorText } from '../auth-error-text';

/**
 * Accept-invite fields (full name + password) for the parent-invite screen.
 * Owns its own TanStack form (validated by `inviteAcceptSchema`) so the parent
 * never passes a generically-typed form instance down — keeping the parent-
 * invite view both small and `any`-free.
 */

export type InviteFormValues = {
  fullName: string;
  password: string;
};

export type InviteFormFieldsProps = {
  isRTL: boolean;
  isSubmitting: boolean;
  onSubmit: (values: InviteFormValues) => void;
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
  return t('auth.invite.acceptError');
}

export function InviteFormFields({ isRTL, isSubmitting, onSubmit }: InviteFormFieldsProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm({
    defaultValues: { password: '', fullName: '' },
    validators: { onChange: inviteAcceptSchema as never },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <View style={{ gap: 14 }}>
      <form.Field
        name="fullName"
        children={(field) => {
          const hasError = field.state.meta.errors.length > 0;
          return (
            <View>
              <AuthFieldShell hasError={hasError}>
                <AuthInput
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  placeholder={t('auth.invite.fullNameLabel')}
                  autoCapitalize="words"
                  testID="fullname-input"
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
                  placeholder={t('auth.invite.passwordLabel')}
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
            label={t('auth.invite.acceptButton')}
            trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.white} />}
            testID="invite-submit-button"
          />
        )}
      />
    </View>
  );
}
