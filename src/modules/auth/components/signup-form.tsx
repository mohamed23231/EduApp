import type { SignupPayload } from '../types';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Eye, EyeOff } from '@/components/ui/icons';
import { useSelectedLanguage } from '@/lib/i18n';
import { SignupSchema } from '../types';

export type SignupFormProps = {
  onSubmit: (values: SignupPayload) => void;
  isSubmitting: boolean;
  error?: string | null;
};

type Role = 'TEACHER' | 'PARENT';

// eslint-disable-next-line max-lines-per-function
export function SignupForm({ onSubmit, isSubmitting, error }: SignupFormProps) {
  const { t, i18n } = useTranslation();
  const { language } = useSelectedLanguage();
  const [showPassword, setShowPassword] = React.useState(false);
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
      email: '',
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
    <View style={styles.container}>
      {error ? <Text style={styles.apiError}>{error}</Text> : null}

      <View style={styles.form}>
        {/* Role Card Selector */}
        <form.Field
          name="role"
          children={(field) => {
            const hasError = field.state.meta.errors.length > 0;
            const errorMsg = getValidationError(field.state.meta.errors);
            const selectedRole = field.state.value as Role | '';

            return (
              <View style={styles.formBlock}>
                <Text style={styles.roleLabel}>
                  {t('auth.signup.roleLabel')}
                </Text>
                <View style={styles.roleCardsRow}>
                  {(['TEACHER', 'PARENT'] as Role[]).map((role) => {
                    const isSelected = selectedRole === role;
                    return (
                      <Pressable
                        key={role}
                        style={[
                          styles.roleCard,
                          isSelected && styles.roleCardSelected,
                        ]}
                        onPress={() => field.handleChange(role)}
                        testID={`role-card-${role.toLowerCase()}`}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                      >
                        <Text style={styles.roleAvatar}>
                          {role === 'TEACHER' ? '👩‍🏫' : '👨‍👩‍👧'}
                        </Text>
                        <Text
                          style={[
                            styles.roleCardLabel,
                            isSelected && styles.roleCardLabelSelected,
                          ]}
                        >
                          {role === 'TEACHER'
                            ? t('auth.signup.teacherLabel')
                            : t('auth.signup.parentLabel')}
                        </Text>
                        <View
                          style={[
                            styles.radioOuter,
                            isSelected && styles.radioOuterSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                {hasError && errorMsg
                  ? <Text style={styles.fieldError}>{errorMsg}</Text>
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
            const errorMsg = getValidationError(field.state.meta.errors);
            return (
              <View style={styles.formBlock}>
                <Text style={styles.label}>{t('auth.signup.fullNameLabel')}</Text>
                <TextInput
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  autoCorrect={false}
                  placeholder={t('auth.signup.fullNamePlaceholder')}
                  placeholderTextColor="#94A3B8"
                  testID="fullName-input"
                  textAlign={isRTL ? 'right' : 'left'}
                  style={[
                    styles.input,
                    isRTL && styles.inputRTL,
                    hasError && styles.inputError,
                  ]}
                />
                {hasError && errorMsg
                  ? <Text style={styles.fieldError}>{errorMsg}</Text>
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
            const errorMsg = getValidationError(field.state.meta.errors);
            return (
              <View style={styles.formBlock}>
                <Text style={styles.label}>{t('auth.signup.emailLabel')}</Text>
                <TextInput
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  placeholder="name@example.com"
                  placeholderTextColor="#94A3B8"
                  testID="email-input"
                  textAlign={isRTL ? 'right' : 'left'}
                  style={[
                    styles.input,
                    isRTL && styles.inputRTL,
                    hasError && styles.inputError,
                  ]}
                />
                {hasError && errorMsg
                  ? <Text style={styles.fieldError}>{errorMsg}</Text>
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
            const errorMsg = getValidationError(field.state.meta.errors);
            return (
              <View style={styles.formBlock}>
                <Text style={styles.label}>{t('auth.signup.passwordLabel')}</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    secureTextEntry={!showPassword}
                    autoCorrect={false}
                    testID="password-input"
                    textAlign={isRTL ? 'right' : 'left'}
                    style={[
                      styles.input,
                      styles.passwordInput,
                      isRTL && styles.inputRTL,
                      hasError && styles.inputError,
                    ]}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    testID="password-toggle"
                  >
                    {showPassword
                      ? <EyeOff width={20} height={20} color="#94A3B8" />
                      : <Eye width={20} height={20} color="#94A3B8" />}
                  </Pressable>
                </View>
                {hasError && errorMsg
                  ? <Text style={styles.fieldError}>{errorMsg}</Text>
                  : null}
              </View>
            );
          }}
        />

        {/* Submit */}
        <form.Subscribe
          selector={state => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, validating]) => (
            <Pressable
              style={[
                styles.submitButton,
                (!canSubmit || isSubmitting || validating) && styles.submitButtonDisabled,
              ]}
              onPress={() => void form.handleSubmit()}
              disabled={!canSubmit || isSubmitting || validating}
              testID="signup-submit-button"
            >
              {isSubmitting || validating
                ? (
                    <ActivityIndicator color="#FFFFFF" />
                  )
                : (
                    <Text style={styles.submitButtonLabel}>
                      {t('auth.signup.submit')}
                    </Text>
                  )}
            </Pressable>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  apiError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderRadius: 10,
    borderWidth: 1,
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    textAlign: 'center',
  },
  container: {
    width: '100%',
  },
  eyeButton: {
    padding: 4,
    position: 'absolute',
    right: 14,
    top: 14,
  },
  fieldError: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'left',
  },
  form: {
    gap: 14,
  },
  formBlock: {
    width: '100%',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 14,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 20,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputRTL: {
    writingDirection: 'rtl',
  },
  label: {
    color: '#334155',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'left',
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  radioInner: {
    backgroundColor: '#2563EB',
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  radioOuter: {
    alignItems: 'center',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    marginTop: 8,
    width: 20,
  },
  radioOuterSelected: {
    borderColor: '#2563EB',
  },
  roleAvatar: {
    fontSize: 36,
    marginBottom: 6,
  },
  roleCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderRadius: 16,
    borderWidth: 2,
    flex: 1,
    paddingVertical: 18,
  },
  roleCardLabel: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '600',
  },
  roleCardLabelSelected: {
    color: '#2563EB',
  },
  roleCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  roleCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 58,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonLabel: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
