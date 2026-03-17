import type { SignupPayload } from '@modules/auth/types';
import { GoogleSignInButton } from '@modules/auth/components/google-sign-in-button';
import {
  AuthButton,
  AuthInput,
  DividerWithText,
  ROLE_OPTIONS,
  RoleCards,
} from '@modules/auth/components/ui';
import { SignupSchema } from '@modules/auth/types';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSelectedLanguage } from '@/lib/i18n';

export type SignupFormProps = {
  onSubmit: (values: SignupPayload) => void;
  isSubmitting: boolean;
  error?: string | null;
  onGoogleSignUp?: (idToken: string, role: Role) => void;
  onGoogleSignInError?: (error: Error) => void;
  isGoogleSigningIn?: boolean;
  showGoogleSignIn?: boolean;
  initialEmail?: string;
  useExistingGoogleToken?: boolean;
};

type Role = 'TEACHER' | 'PARENT' | 'MANAGER';

// eslint-disable-next-line max-lines-per-function
export function SignupForm({
  onSubmit,
  isSubmitting,
  error,
  onGoogleSignUp,
  onGoogleSignInError,
  isGoogleSigningIn = false,
  showGoogleSignIn = false,
  initialEmail = '',
  useExistingGoogleToken = false,
}: SignupFormProps) {
  const { t, i18n } = useTranslation();
  const { language } = useSelectedLanguage();
  const [googleRoleError, setGoogleRoleError] = React.useState<string | null>(null);
  const isRTL = i18n.language === 'ar' || language === 'ar';

  const getValidationError = (fieldErrors: unknown[]) => {
    const firstError = fieldErrors[0];

    if (!firstError) {
      return undefined;
    }

    if (typeof firstError === 'string') {
      return t(firstError);
    }

    if (
      typeof firstError === 'object'
      && firstError !== null
      && 'message' in firstError
      && typeof firstError.message === 'string'
    ) {
      return t(firstError.message);
    }

    return t('auth.signup.genericError');
  };

  const form = useForm({
    defaultValues: {
      role: '' as Role | '',
      fullName: '',
      email: initialEmail,
      password: '',
    },
    validators: {
      onChange: SignupSchema as any,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value as SignupPayload);
    },
  });

  return (
    <View className="w-full">
      {error
        ? (
            <View className="mb-4 flex-row items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <Text className="flex-1 text-sm text-red-600">{error}</Text>
            </View>
          )
        : null}

      <View className="gap-3.5">
        {/* Role Card Selector */}
        <form.Field
          name="role"
          children={(field) => {
            const hasError = field.state.meta.errors.length > 0;
            const errorMsg = getValidationError(field.state.meta.errors);
            const selectedRole = field.state.value as Role | '';

            return (
              <View>
                <RoleCards
                  roles={[ROLE_OPTIONS.TEACHER, ROLE_OPTIONS.PARENT, ROLE_OPTIONS.MANAGER]}
                  selected={selectedRole || null}
                  onSelect={(role) => {
                    field.handleChange(role as Role);
                    setGoogleRoleError(null);
                  }}
                  overlineLabel={t('auth.signup.roleLabel')}
                />
                {hasError && errorMsg
                  ? <Text className="ms-1 mt-1 text-xs text-red-500">{errorMsg}</Text>
                  : null}
                {!hasError && googleRoleError
                  ? <Text className="ms-1 mt-1 text-xs text-red-500">{googleRoleError}</Text>
                  : null}
              </View>
            );
          }}
        />

        {/* Full Name */}
        <form.Field
          name="fullName"
          children={(field) => {
            const errorMsg = getValidationError(field.state.meta.errors);
            return (
              <AuthInput
                label={t('auth.signup.fullNameLabel')}
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                autoCorrect={false}
                placeholder={t('auth.signup.fullNamePlaceholder')}
                textAlign={isRTL ? 'right' : 'left'}
                error={errorMsg}
                testID="fullName-input"
              />
            );
          }}
        />

        {/* Email */}
        <form.Field
          name="email"
          children={(field) => {
            const errorMsg = getValidationError(field.state.meta.errors);
            return (
              <AuthInput
                label={t('auth.signup.emailLabel')}
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                placeholder="name@example.com"
                textAlign={isRTL ? 'right' : 'left'}
                error={errorMsg}
                testID="email-input"
              />
            );
          }}
        />

        {/* Password */}
        <form.Field
          name="password"
          children={(field) => {
            const errorMsg = getValidationError(field.state.meta.errors);
            return (
              <AuthInput
                isPassword
                label={t('auth.signup.passwordLabel')}
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                autoCorrect={false}
                textAlign={isRTL ? 'right' : 'left'}
                error={errorMsg}
                testID="password-input"
              />
            );
          }}
        />

        {/* Submit */}
        <form.Subscribe
          selector={state => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, validating]) => (
            <AuthButton
              variant="black"
              title={t('auth.signup.submit')}
              onPress={() => void form.handleSubmit()}
              disabled={!canSubmit || isSubmitting || (validating as boolean)}
              loading={isSubmitting || (validating as boolean)}
            />
          )}
        />

        {showGoogleSignIn
          ? (
              <>
                <DividerWithText text={t('auth.signup.orConnectWith')} />

                <GoogleSignInButton
                  onSuccess={(idToken) => {
                    const selectedRole = form.state.values.role as Role | '';
                    if (!selectedRole) {
                      setGoogleRoleError(t('auth.signup.validation.roleRequired'));
                      return;
                    }
                    setGoogleRoleError(null);
                    onGoogleSignUp?.(idToken, selectedRole as Role);
                  }}
                  onError={(googleError) => {
                    onGoogleSignInError?.(googleError);
                  }}
                  isLoading={isGoogleSigningIn}
                  variant="signup"
                />

                {useExistingGoogleToken
                  ? (
                      <Pressable
                        className={`h-[52px] items-center justify-center rounded-xl bg-blue-500 ${isGoogleSigningIn ? 'opacity-50' : ''}`}
                        onPress={() => {
                          const selectedRole = form.state.values.role as Role | '';
                          if (!selectedRole) {
                            setGoogleRoleError(t('auth.signup.validation.roleRequired'));
                            return;
                          }
                          setGoogleRoleError(null);
                          onGoogleSignUp?.('', selectedRole as Role);
                        }}
                        disabled={isGoogleSigningIn}
                        testID="google-continue-button"
                      >
                        {isGoogleSigningIn
                          ? (
                              <ActivityIndicator color="#FFFFFF" />
                            )
                          : (
                              <Text className="text-base font-semibold text-white">
                                {t('auth.signup.continueWithGoogle')}
                              </Text>
                            )}
                      </Pressable>
                    )
                  : null}
              </>
            )
          : null}
      </View>
    </View>
  );
}
