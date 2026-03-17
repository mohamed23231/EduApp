import type { ParentInviteValidateResponse } from '@modules/auth/types';
import {
  AuthButton,
  AuthInput,
  AuthLayout,
} from '@modules/auth/components/ui';
import { acceptParentInvite, validateParentInvite } from '@modules/auth/services';
import { useForm } from '@tanstack/react-form';
import { useLocalSearchParams, useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserRole } from '@/core/auth/roles';
import { setOnboardingContext, signIn } from '@/features/auth/use-auth-store';

// eslint-disable-next-line max-lines-per-function
export default function ParentInviteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const insets = useSafeAreaInsets();

  const [showPassword, setShowPassword] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(true);
  const [inviteValidation, setInviteValidation] = React.useState<ParentInviteValidateResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      password: '',
      fullName: '',
    },
    onSubmit: async ({ value }) => {
      if (!token) {
        setError(t('auth.invite.invalidToken'));
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const response = await acceptParentInvite({
          token,
          password: value.password,
          fullName: value.fullName || undefined,
        });

        // Store auth session
        const authUser = response.user?.email
          ? {
              id: response.user.id,
              email: response.user.email,
              role: response.user.role as UserRole,
            }
          : null;

        signIn({
          token: {
            access: response.accessToken,
            refresh: response.refreshToken,
          },
          user: authUser,
        });

        // Navigate to onboarding if still required, otherwise home.
        if (response.onboardingRequired) {
          if (response.user?.email) {
            const onboardingRole
              = response.user.role === UserRole.TEACHER
                || response.user.role === UserRole.PARENT
                ? (response.user.role as 'TEACHER' | 'PARENT')
                : undefined;
            setOnboardingContext({
              email: response.user.email,
              ...(onboardingRole ? { role: onboardingRole } : {}),
              ...(response.user.fullName
                ? { fullName: response.user.fullName }
                : {}),
            });
          }
          router.replace('/onboarding');
        }
        else {
          router.replace('/(tabs)');
        }
      }
      catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : null;
        setError(errMsg || t('auth.invite.acceptError'));
      }
      finally {
        setIsSubmitting(false);
      }
    },
  });

  // Validate invite token on mount
  React.useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        setError(t('auth.invite.invalidToken'));
        setIsValidating(false);
        return;
      }

      try {
        const validation = await validateParentInvite(token);
        setInviteValidation(validation);

        if (!validation.valid) {
          if (validation.expired) {
            setError(t('auth.invite.expired'));
          }
          else if (validation.alreadyOnboarded) {
            setError(t('auth.invite.alreadyOnboarded'));
          }
          else {
            setError(t('auth.invite.invalid'));
          }
        }
      }
      catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : null;
        setError(errMsg || t('auth.invite.validationError'));
      }
      finally {
        setIsValidating(false);
      }
    };

    validateInvite();
  }, [t, token]);

  if (isValidating) {
    return (
      <View
        className="flex-1 items-center justify-center bg-white"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-center text-[16px] text-slate-500">
          {t('auth.invite.validating')}
        </Text>
      </View>
    );
  }

  if (error && !inviteValidation?.valid) {
    return (
      <View
        className="flex-1 items-center justify-center bg-white px-7"
        style={{ paddingTop: insets.top }}
      >
        <Text className="mb-3 text-center text-[24px] font-bold text-gray-900">
          {t('auth.invite.errorTitle')}
        </Text>
        <Text className="mb-6 text-center text-[16px] text-slate-500">
          {error}
        </Text>
        <AuthButton
          variant="blue"
          title={t('common.back')}
          onPress={() => router.replace('/login')}
        />
      </View>
    );
  }

  return (
    <AuthLayout testID="parent-invite-screen">
      {/* Lottie hero */}
      <View className="mt-4 items-center">
        <LottieView
          source={require('@assets/lottie/education-welcome.json')}
          autoPlay
          loop
          style={{ width: 200, height: 160 }}
        />
      </View>

      {/* Title + subtitle */}
      <View className="mt-4 mb-6 items-center gap-1">
        <Text className="text-center text-[28px] font-bold text-gray-900">
          {t('auth.invite.title')}
        </Text>
        <Text className="text-center text-[15px] text-gray-500">
          {t('auth.invite.subtitle')}
        </Text>
      </View>

      {/* API error */}
      {error
        ? (
            <Text className="mb-3 text-center text-[14px] font-medium text-red-600">
              {error}
            </Text>
          )
        : null}

      {/* Form */}
      <View className="gap-3.5">
        <form.Field
          name="fullName"
          children={field => (
            <AuthInput
              label={t('auth.invite.fullNameLabel')}
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              autoCapitalize="words"
              autoCorrect={false}
              placeholder="John Doe"
              testID="fullname-input"
            />
          )}
        />

        <form.Field
          name="password"
          children={field => (
            <AuthInput
              label={t('auth.invite.passwordLabel')}
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              isPassword={!showPassword}
              secureTextEntry={!showPassword}
              autoCorrect={false}
              testID="password-input"
            />
          )}
        />

        {/* Toggle show/hide password */}
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          className="self-end"
          hitSlop={8}
        >
          <Text className="text-[13px] font-medium text-blue-600">
            {showPassword ? t('auth.common.optional') : t('auth.common.optional')}
          </Text>
        </Pressable>

        <form.Subscribe
          selector={state => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, validating]) => (
            <View className="mt-2 mb-8">
              <AuthButton
                variant="blue"
                title={t('auth.invite.acceptButton')}
                onPress={() => void form.handleSubmit()}
                disabled={!canSubmit || isSubmitting || Boolean(validating)}
                loading={isSubmitting || Boolean(validating)}
              />
            </View>
          )}
        />
      </View>
    </AuthLayout>
  );
}
