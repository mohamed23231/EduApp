import type { PhoneLoginParams } from '@modules/auth/types';
import { AuthButton, AuthInput } from '@modules/auth/components/ui';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Text,
  View,
} from 'react-native';
import { PhoneField } from '@/components/ui';
import {
  buildE164Phone,
  DEFAULT_COUNTRY_CODE,
  getPhoneValidationErrorKey,
} from '@/shared/utils/phone';

export type PhoneLoginFormProps = {
  onSubmit: (data: PhoneLoginParams) => void;
  isSubmitting: boolean;
  error?: string | null;
  loginModeToggle?: React.ReactNode;
};

export function PhoneLoginForm({
  onSubmit,
  isSubmitting,
  error,
  loginModeToggle,
}: PhoneLoginFormProps) {
  const { t } = useTranslation();
  const [countryCode, setCountryCode] = React.useState(DEFAULT_COUNTRY_CODE);
  const [localNumber, setLocalNumber] = React.useState('');
  const [clientError, setClientError] = React.useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      phone: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      const normalizedPhone = buildE164Phone(countryCode, localNumber);
      if (!normalizedPhone) {
        setClientError(getPhoneValidationErrorKey(countryCode));
        return;
      }
      setClientError(null);
      onSubmit({ ...value, phone: normalizedPhone });
    },
  });
  const normalizedPhone = buildE164Phone(countryCode, localNumber);

  return (
    <View className="gap-3.5">
      {loginModeToggle ?? null}
      {error || clientError
        ? (
            <Text className="mb-3 text-center text-sm font-medium text-red-600">
              {t(clientError || error || '', { defaultValue: clientError || error || '' })}
            </Text>
          )
        : null}

      <View className="w-full">
        <PhoneField
          label={t('auth.phone.phoneLabel')}
          countryCode={countryCode}
          localNumber={localNumber}
          onCountryCodeChange={setCountryCode}
          onLocalNumberChange={setLocalNumber}
          testIDPrefix="phone-login"
        />
      </View>

      <View className="w-full">
        <form.Field
          name="password"
          children={field => (
            <AuthInput
              label={t('auth.phone.passwordLabel')}
              isPassword
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              autoCorrect={false}
              testID="phone-password-input"
            />
          )}
        />
      </View>

      <form.Subscribe
        selector={state => [state.canSubmit, state.isSubmitting] as const}
        children={([canSubmit, validating]) => (
          <AuthButton
            title={t('auth.phone.loginButton')}
            variant="black"
            onPress={() => void form.handleSubmit()}
            disabled={!canSubmit || isSubmitting || validating || !normalizedPhone}
            loading={isSubmitting || validating}
          />
        )}
      />
    </View>
  );
}
