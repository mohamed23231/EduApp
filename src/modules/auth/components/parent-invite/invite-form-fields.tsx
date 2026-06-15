import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { AuthFieldShell, AuthInput, Icon, PressButton } from '@/components/ui';
import colors from '@/components/ui/colors';

/**
 * Accept-invite fields (full name + password) for the parent-invite screen.
 * Owns its own TanStack form so the parent never passes a generically-typed
 * form instance down — keeping the parent-invite view both small and `any`-free.
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

export function InviteFormFields({ isRTL, isSubmitting, onSubmit }: InviteFormFieldsProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm({
    defaultValues: { password: '', fullName: '' },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <View style={{ gap: 14 }}>
      <form.Field
        name="fullName"
        children={field => (
          <AuthFieldShell>
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
        )}
      />

      <form.Field
        name="password"
        children={field => (
          <AuthFieldShell>
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
            >
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={20} color={colors.neutral.dim} />
            </Pressable>
          </AuthFieldShell>
        )}
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
