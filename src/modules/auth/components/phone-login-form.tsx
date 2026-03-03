import type { PhoneLoginParams } from '../types';
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

export type PhoneLoginFormProps = {
  onSubmit: (data: PhoneLoginParams) => void;
  isSubmitting: boolean;
  error?: string | null;
};

export function PhoneLoginForm({
  onSubmit,
  isSubmitting,
  error,
}: PhoneLoginFormProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm({
    defaultValues: {
      phone: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.apiError}>{error}</Text> : null}

      <form.Field
        name="phone"
        children={field => (
          <View style={styles.formBlock}>
            <Text style={styles.label}>{t('auth.phone.phoneLabel')}</Text>
            <TextInput
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              autoCapitalize="none"
              keyboardType="phone-pad"
              autoCorrect={false}
              placeholder="+966 5X XXX XXXX"
              placeholderTextColor="#94A3B8"
              testID="phone-input"
              style={styles.input}
            />
          </View>
        )}
      />

      <View style={styles.formBlock}>
        <Text style={styles.label}>{t('auth.phone.passwordLabel')}</Text>
        <View style={styles.passwordInputWrapper}>
          <form.Field
            name="password"
            children={field => (
              <TextInput
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                secureTextEntry={!showPassword}
                autoCorrect={false}
                testID="phone-password-input"
                style={[
                  styles.input,
                  styles.passwordInput,
                ]}
              />
            )}
          />
          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword
              ? <EyeOff width={20} height={20} color="#94A3B8" />
              : <Eye width={20} height={20} color="#94A3B8" />}
          </Pressable>
        </View>
      </View>

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
            testID="phone-login-submit-button"
          >
            {isSubmitting || validating
              ? <ActivityIndicator color="#FFFFFF" />
              : (
                  <Text style={styles.submitButtonLabel}>
                    {t('auth.phone.loginButton')}
                  </Text>
                )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  apiError: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  container: {
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
  label: {
    color: '#334155',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  eyeButton: {
    padding: 4,
    position: 'absolute',
    right: 14,
    top: 14,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitButtonLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
