import { Ionicons } from '@expo/vector-icons';
import { PhoneResetPasswordForm } from '@modules/auth/components/phone-reset-password-form';
import {
  AuthButton,
  AuthInput,
  AuthLayout,
  SegmentedControl,
} from '@modules/auth/components/ui';
import { usePhoneResetPasswordConfirm, usePhoneResetPasswordRequest } from '@modules/auth/hooks/use-phone-reset-password';
import { googleAuthService } from '@modules/auth/services/google-auth.service';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';

export type ResetTokenData
  = | { type: 'code'; code: string }
    | { type: 'fragment'; accessToken: string; refreshToken: string };

type ResetPasswordScreenProps = {
  tokenData: ResetTokenData | null;
};

/**
 * Reset Password Screen
 *
 * Handles password reset via deep link from email.
 * Supports both code-based (PKCE) and fragment-based token formats.
 * Code flow takes precedence over fragment flow.
 *
 * All Supabase interaction is handled by the backend via
 * POST /auth/reset-password/complete — frontend never calls Supabase directly.
 *
 * Requirements: 7.2, 7.5, 7.6, 11.1
 */
// eslint-disable-next-line max-lines-per-function
export function ResetPasswordScreen({ tokenData }: ResetPasswordScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetMode, setResetMode] = useState<'email' | 'phone'>(tokenData ? 'email' : 'phone');
  const { mutateAsync: requestReset, isPending: isRequestPending } = usePhoneResetPasswordRequest();
  const { mutateAsync: confirmReset, isPending: isConfirmPending } = usePhoneResetPasswordConfirm();
  const [phoneResetSuccess, setPhoneResetSuccess] = useState(false);

  const navigateToLogin = () => router.replace('/login' as any);

  const handleReset = async () => {
    setError(null);
    if (!newPassword || !confirmPassword) {
      setError(t('auth.reset_password.passwordRequired'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.reset_password.passwordMismatch'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('auth.reset_password.passwordTooShort'));
      return;
    }
    if (!tokenData) {
      setError(t('auth.reset_password.expiredToken'));
      return;
    }
    setIsResetting(true);
    try {
      const payload
        = tokenData.type === 'code'
          ? { code: tokenData.code, newPassword }
          : { accessToken: tokenData.accessToken, refreshToken: tokenData.refreshToken, newPassword };
      await googleAuthService.completePasswordReset(payload);
      setSuccess(true);
    }
    catch {
      setError(t('auth.reset_password.expiredToken'));
    }
    finally {
      setIsResetting(false);
    }
  };

  // ─── Success state (phone or email) ─────────────────────────────────────────

  if (phoneResetSuccess || success) {
    return (
      <AuthLayout testID="reset-password-screen">
        <View className="flex-1 items-center justify-center gap-5 py-12">
          <LottieView
            source={require('@assets/lottie/success-check.json')}
            autoPlay
            loop={false}
            style={{ width: 120, height: 120 }}
          />
          <Text className="text-center text-[22px] font-bold text-gray-900">
            {t('auth.reset_password.successTitle')}
          </Text>
          <Text className="text-center text-[15px] text-gray-500">
            {t('auth.reset_password.successSubtitle')}
          </Text>
          <AuthButton
            variant="blue"
            title={t('auth.reset_password.loginButton')}
            onPress={navigateToLogin}
          />
        </View>
      </AuthLayout>
    );
  }

  // ─── Phone reset flow ────────────────────────────────────────────────────────

  if (!tokenData || resetMode === 'phone') {
    return (
      <AuthLayout testID="reset-password-screen">
        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          className="mt-2 mb-4 size-10 items-center justify-center rounded-full border border-gray-200"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={20} color="#374151" />
        </Pressable>

        {/* Lottie hero */}
        <View className="items-center">
          <LottieView
            source={require('@assets/lottie/security-lock.json')}
            autoPlay
            loop
            renderMode={Platform.OS === 'android' ? 'HARDWARE' : 'AUTOMATIC'}
            style={{ width: 200, height: 160 }}
          />
        </View>

        {/* Title + subtitle */}
        <View className="mt-4 mb-6 items-center gap-1">
          <Text className="text-[28px] font-bold text-gray-900">
            {t('auth.reset_password.title')}
          </Text>
          <Text className="text-center text-[15px] text-gray-500">
            {t('auth.phone.resetSubtitle')}
          </Text>
        </View>

        {/* Mode toggle — only shown when token is available */}
        {tokenData
          ? (
              <View className="mb-5">
                <SegmentedControl
                  segments={[t('auth.signup.emailTab'), t('auth.signup.phoneTab')]}
                  activeIndex={resetMode === 'email' ? 0 : 1}
                  onChange={index => setResetMode(index === 0 ? 'email' : 'phone')}
                />
              </View>
            )
          : null}

        <PhoneResetPasswordForm
          onRequest={async (data) => {
            await requestReset(data);
          }}
          onConfirm={async (data) => {
            await confirmReset(data);
            setPhoneResetSuccess(true);
          }}
          isSubmitting={isRequestPending || isConfirmPending}
          error={error}
        />
      </AuthLayout>
    );
  }

  // ─── Email / token-based reset flow ─────────────────────────────────────────

  return (
    <AuthLayout testID="reset-password-screen">
      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        className="mt-2 mb-4 size-10 items-center justify-center rounded-full border border-gray-200"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="chevron-back" size={20} color="#374151" />
      </Pressable>

      {/* Lottie hero */}
      <View className="items-center">
        <LottieView
          source={require('@assets/lottie/security-lock.json')}
          autoPlay
          loop
          renderMode={Platform.OS === 'android' ? 'HARDWARE' : 'AUTOMATIC'}
          style={{ width: 200, height: 160 }}
        />
      </View>

      {/* Title + subtitle */}
      <View className="mt-4 mb-6 items-center gap-1">
        <Text className="text-[28px] font-bold text-gray-900">
          {t('auth.reset_password.title')}
        </Text>
        <Text className="text-center text-[15px] text-gray-500">
          {t('auth.reset_password.subtitle')}
        </Text>
      </View>

      {/* Mode toggle */}
      <View className="mb-5">
        <SegmentedControl
          segments={[t('auth.signup.emailTab'), t('auth.signup.phoneTab')]}
          activeIndex={resetMode === 'email' ? 0 : 1}
          onChange={index => setResetMode(index === 0 ? 'email' : 'phone')}
        />
      </View>

      {/* New password field */}
      <View className="mb-4">
        <AuthInput
          label={t('auth.reset_password.newPasswordLabel')}
          isPassword
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder={t('auth.reset_password.newPasswordPlaceholder')}
          autoComplete="new-password"
          editable={!isResetting}
        />
      </View>

      {/* Confirm password field */}
      <View className="mb-4">
        <AuthInput
          label={t('auth.reset_password.confirmPasswordLabel')}
          isPassword
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={t('auth.reset_password.confirmPasswordPlaceholder')}
          autoComplete="new-password"
          editable={!isResetting}
        />
      </View>

      {/* Error message */}
      {error
        ? (
            <Text className="mb-4 text-center text-[14px] text-red-600">
              {error}
            </Text>
          )
        : null}

      {/* Submit */}
      <View className="mt-2 mb-8">
        <AuthButton
          variant="blue"
          title={t('auth.reset_password.submit')}
          onPress={() => void handleReset()}
          disabled={isResetting}
          loading={isResetting}
        />
      </View>
    </AuthLayout>
  );
}
