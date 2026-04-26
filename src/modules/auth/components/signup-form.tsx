import type { SignupPayload } from '../types';
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
import { useSelectedLanguage } from '@/lib/i18n';
import { SignupSchema } from '../types';
import { GoogleSignInButton } from './google-sign-in-button';

/**
 * SignupForm (email) — dark identity matching login.
 * Per `contracts/visual-auth.md`. Role pill row, dark inputs, gradient CTA.
 */

type Role = 'TEACHER' | 'PARENT' | 'MANAGER';

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

const ROLE_OPTIONS: Array<{
  value: Role;
  labelKey: 'auth.signup.teacherLabel' | 'auth.signup.parentLabel' | 'auth.signup.managerLabel';
  icon: 'graduationCap' | 'users' | 'building';
}> = [
  { value: 'TEACHER', labelKey: 'auth.signup.teacherLabel', icon: 'graduationCap' },
  { value: 'PARENT', labelKey: 'auth.signup.parentLabel', icon: 'users' },
  { value: 'MANAGER', labelKey: 'auth.signup.managerLabel', icon: 'building' },
];

function getValidationError(
  t: (key: string) => string,
  fieldErrors: unknown[],
): string | undefined {
  const firstError = fieldErrors[0];
  if (!firstError)
    return undefined;
  if (typeof firstError === 'string')
    return t(firstError);
  if (
    typeof firstError === 'object'
    && firstError !== null
    && 'message' in firstError
    && typeof (firstError as { message: unknown }).message === 'string'
  ) {
    return t((firstError as { message: string }).message);
  }
  return t('auth.signup.genericError');
}

type RolePillProps = {
  selected: boolean;
  label: string;
  iconName: 'graduationCap' | 'users' | 'building';
  onPress: () => void;
  testID?: string;
};

function RolePill({ selected, label, iconName, onPress, testID }: RolePillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      testID={testID}
      style={({ pressed }) => ({
        flex: 1,
        height: 64,
        borderRadius: 16,
        paddingHorizontal: 8,
        backgroundColor: selected
          ? 'rgba(34,197,114,0.16)'
          : pressed
            ? 'rgba(34,197,114,0.10)'
            : 'rgba(255,255,255,0.06)',
        borderWidth: 1.5,
        borderColor: selected
          ? colors.brand.primary
          : 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      })}
    >
      <Icon
        name={iconName}
        size={20}
        color={selected ? colors.brand.primary : colors.neutral.dim}
      />
      <Text
        style={{
          color: selected ? colors.neutral.white : colors.neutral.dim,
          fontSize: 12,
          fontWeight: '700',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

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
  const isRTL = i18n.language === 'ar' || language === 'ar';
  const [showPassword, setShowPassword] = React.useState(false);
  const [googleRoleError, setGoogleRoleError] = React.useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      role: '' as Role | '',
      fullName: '',
      email: initialEmail,
      password: '',
    },
    validators: { onChange: SignupSchema as never },
    onSubmit: async ({ value }) => {
      onSubmit(value as SignupPayload);
    },
  });

  return (
    <View style={{ gap: 14 }}>
      {error
        ? (
            <Text
              style={{
                color: colors.semantic.absent,
                fontSize: 13,
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              {error}
            </Text>
          )
        : null}

      {/* Role pill row */}
      <form.Field
        name="role"
        children={(field) => {
          const hasError = field.state.meta.errors.length > 0;
          const errorMsg = getValidationError(t, field.state.meta.errors);
          const selectedRole = field.state.value as Role | '';
          return (
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
                    selected={selectedRole === option.value}
                    label={t(option.labelKey)}
                    iconName={option.icon}
                    onPress={() => {
                      field.handleChange(option.value);
                      setGoogleRoleError(null);
                    }}
                    testID={`role-card-${option.value.toLowerCase()}`}
                  />
                ))}
              </View>
              {hasError && errorMsg
                ? (
                    <Text
                      style={{
                        color: colors.semantic.absent,
                        fontSize: 12,
                        marginTop: 6,
                        marginStart: 4,
                      }}
                    >
                      {errorMsg}
                    </Text>
                  )
                : null}
              {!hasError && googleRoleError
                ? (
                    <Text
                      style={{
                        color: colors.semantic.absent,
                        fontSize: 12,
                        marginTop: 6,
                        marginStart: 4,
                      }}
                    >
                      {googleRoleError}
                    </Text>
                  )
                : null}
            </View>
          );
        }}
      />

      {/* Full Name */}
      <form.Field
        name="fullName"
        children={(field) => {
          const hasError = field.state.meta.errors.length > 0;
          const errorMsg = getValidationError(t, field.state.meta.errors);
          return (
            <View>
              <AuthFieldShell hasError={hasError}>
                <AuthInput
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  placeholder={t('auth.signup.fullNamePlaceholder')}
                  autoCapitalize="words"
                  testID="fullName-input"
                  textAlign={isRTL ? 'right' : 'left'}
                  fontSize={16}
                  letterSpacing={0}
                />
              </AuthFieldShell>
              {hasError && errorMsg
                ? (
                    <Text
                      style={{
                        color: colors.semantic.absent,
                        fontSize: 12,
                        marginTop: 6,
                        marginStart: 4,
                      }}
                    >
                      {errorMsg}
                    </Text>
                  )
                : null}
            </View>
          );
        }}
      />

      {/* Email */}
      <form.Field
        name="email"
        children={(field) => {
          const hasError = field.state.meta.errors.length > 0;
          const errorMsg = getValidationError(t, field.state.meta.errors);
          return (
            <View>
              <AuthFieldShell hasError={hasError}>
                <AuthInput
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  placeholder={t('auth.signup.emailLabel', 'Email')}
                  keyboardType="email-address"
                  testID="email-input"
                  textAlign={isRTL ? 'right' : 'left'}
                  fontSize={16}
                  letterSpacing={0}
                />
              </AuthFieldShell>
              {hasError && errorMsg
                ? (
                    <Text
                      style={{
                        color: colors.semantic.absent,
                        fontSize: 12,
                        marginTop: 6,
                        marginStart: 4,
                      }}
                    >
                      {errorMsg}
                    </Text>
                  )
                : null}
            </View>
          );
        }}
      />

      {/* Password */}
      <form.Field
        name="password"
        children={(field) => {
          const hasError = field.state.meta.errors.length > 0;
          const errorMsg = getValidationError(t, field.state.meta.errors);
          return (
            <View>
              <AuthFieldShell hasError={hasError}>
                <AuthInput
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  placeholder={t('auth.signup.passwordLabel', 'Password')}
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
                  testID="password-toggle"
                >
                  <Icon
                    name={showPassword ? 'eyeOff' : 'eye'}
                    size={20}
                    color={colors.neutral.dim}
                  />
                </Pressable>
              </AuthFieldShell>
              {hasError && errorMsg
                ? (
                    <Text
                      style={{
                        color: colors.semantic.absent,
                        fontSize: 12,
                        marginTop: 6,
                        marginStart: 4,
                      }}
                    >
                      {errorMsg}
                    </Text>
                  )
                : null}
            </View>
          );
        }}
      />

      {/* Submit */}
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
            label={t('auth.signup.submit')}
            trailingIcon={(
              <Icon
                name="arrowR"
                size={18}
                color={colors.neutral.white}
              />
            )}
            testID="signup-submit-button"
          />
        )}
      />

      {showGoogleSignIn
        ? (
            <View style={{ marginTop: 4 }}>
              <GoogleSignInButton
                onSuccess={(idToken) => {
                  const selectedRole = form.state.values.role as Role | '';
                  if (!selectedRole) {
                    setGoogleRoleError(t('auth.signup.validation.roleRequired'));
                    return;
                  }
                  setGoogleRoleError(null);
                  onGoogleSignUp?.(idToken, selectedRole);
                }}
                onError={googleError => onGoogleSignInError?.(googleError)}
                isLoading={isGoogleSigningIn}
                variant="signup"
              />

              {useExistingGoogleToken
                ? (
                    <View style={{ marginTop: 8 }}>
                      <PressButton
                        variant="gradient"
                        size="lg"
                        fullWidth
                        loading={isGoogleSigningIn}
                        onPress={() => {
                          const selectedRole = form.state.values.role as Role | '';
                          if (!selectedRole) {
                            setGoogleRoleError(t('auth.signup.validation.roleRequired'));
                            return;
                          }
                          setGoogleRoleError(null);
                          onGoogleSignUp?.('', selectedRole);
                        }}
                        label={t('auth.signup.continueWithGoogle')}
                        testID="google-continue-button"
                      />
                    </View>
                  )
                : null}
            </View>
          )
        : null}
    </View>
  );
}
