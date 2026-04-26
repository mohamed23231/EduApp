import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AuthFieldShell,
  AuthInput,
  AuthShell,
  GradientText,
  Icon,
  PressButton,
  TabaMark,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { useSelectedLanguage } from '@/lib/i18n';
import { PhoneResetPasswordForm } from '../components/phone-reset-password-form';
import { usePhoneResetPasswordConfirm, usePhoneResetPasswordRequest } from '../hooks/use-phone-reset-password';
import { googleAuthService } from '../services/google-auth.service';

export type ResetTokenData
  = | { type: 'code'; code: string }
    | { type: 'fragment'; accessToken: string; refreshToken: string };

type ResetPasswordScreenProps = {
  tokenData: ResetTokenData | null;
};

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

  return (
    <ResetPasswordView
      {...{
        router,
        t,
        tokenData,
        resetMode,
        setResetMode,
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        handleReset,
        isResetting,
        error,
        success,
        phoneResetSuccess,
        setPhoneResetSuccess,
        isRequestPending,
        isConfirmPending,
        requestReset,
        confirmReset,
      }}
    />
  );
}

type ResetPasswordViewProps = {
  router: ReturnType<typeof useRouter>;
  t: (key: string, opts?: any) => string;
  tokenData: ResetTokenData | null;
  resetMode: 'email' | 'phone';
  setResetMode: (mode: 'email' | 'phone') => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  handleReset: () => Promise<void>;
  isResetting: boolean;
  error: string | null;
  success: boolean;
  phoneResetSuccess: boolean;
  setPhoneResetSuccess: (v: boolean) => void;
  isRequestPending: boolean;
  isConfirmPending: boolean;
  requestReset: any;
  confirmReset: any;
};

// eslint-disable-next-line max-lines-per-function
function ResetPasswordView({
  router,
  t,
  tokenData,
  resetMode,
  setResetMode,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  handleReset,
  isResetting,
  error,
  success,
  phoneResetSuccess,
  setPhoneResetSuccess,
  isRequestPending,
  isConfirmPending,
  requestReset,
  confirmReset,
}: ResetPasswordViewProps) {
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useSelectedLanguage();
  const isRTL = language === 'ar';

  const toggleLanguage = () => setLanguage(language === 'en' ? 'ar' : 'en');

  // Success state — dark shell with success message + back to login CTA.
  if (phoneResetSuccess || success) {
    return (
      <AuthShell testID="reset-success-auth-shell">
        <StatusBar style="light" translucent />
        <View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(34,197,114,0.18)',
              borderWidth: 1.5,
              borderColor: colors.brand.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="check" size={36} color={colors.brand.primary} />
          </View>
          <Text
            style={{
              color: colors.neutral.white,
              fontSize: 22,
              fontWeight: '700',
              textAlign: 'center',
              letterSpacing: -0.5,
            }}
          >
            {t('auth.reset_password.success')}
          </Text>
          <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
            <PressButton
              variant="gradient"
              size="lg"
              fullWidth
              onPress={() => router.replace('/login' as any)}
              label={t('auth.login.submit')}
              trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.white} />}
              testID="reset-success-login-button"
            />
          </View>
        </View>
      </AuthShell>
    );
  }

  const isPhoneFlow = !tokenData || resetMode === 'phone';
  const heroLine1 = isPhoneFlow
    ? t('auth.reset_password.heroLine1Phone', 'Reset')
    : t('auth.reset_password.heroLine1Email', 'New');
  const heroLine2 = isPhoneFlow
    ? t('auth.reset_password.heroLine2Phone', 'your access.')
    : t('auth.reset_password.heroLine2Email', 'password.');

  return (
    <AuthShell testID="reset-auth-shell">
      <StatusBar style="light" translucent />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingTop: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                testID="reset-back-button"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(255,255,255,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="arrowL" size={18} color={colors.neutral.white} />
              </Pressable>
              <TabaMark size={48} frame="ink" />
            </View>
            <Pressable
              onPress={toggleLanguage}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Icon name="globe" size={14} color={colors.neutral.dim} />
              <Text style={{ color: colors.neutral.dim, fontSize: 13, fontWeight: '700' }}>
                {language === 'en' ? 'العربية' : 'English'}
              </Text>
            </Pressable>
          </View>

          {/* Hero */}
          <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
            <Text
              style={{
                color: colors.neutral.white,
                fontSize: 32,
                lineHeight: 36,
                fontWeight: '700',
                letterSpacing: -1.2,
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              }}
            >
              {heroLine1}
            </Text>
            <View style={{ marginTop: 2, alignSelf: isRTL ? 'flex-end' : 'flex-start' }}>
              <GradientText size={32} weight="700">
                {heroLine2}
              </GradientText>
            </View>
            <Text
              style={{
                color: colors.neutral.dim,
                fontSize: 14,
                lineHeight: 22,
                fontWeight: '500',
                marginTop: 12,
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              }}
            >
              {isPhoneFlow
                ? t('auth.phone.resetSubtitle')
                : t('auth.reset_password.subtitle')}
            </Text>
          </View>

          {/* Body */}
          <View style={{ paddingHorizontal: 24, marginTop: 22, flex: 1 }}>
            {isPhoneFlow
              ? (
                  <View style={{ gap: 12 }}>
                    {tokenData
                      ? (
                          <Pressable
                            onPress={() => setResetMode('email')}
                            style={{
                              height: 50,
                              borderRadius: 14,
                              backgroundColor: 'rgba(255,255,255,0.06)',
                              borderWidth: 1.5,
                              borderColor: 'rgba(255,255,255,0.12)',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexDirection: 'row',
                              gap: 10,
                              marginBottom: 6,
                            }}
                            testID="reset-mode-email"
                          >
                            <Icon name="mail" size={18} color={colors.neutral.white} />
                            <Text style={{ color: colors.neutral.white, fontSize: 14, fontWeight: '600' }}>
                              {t('auth.reset_password.useEmailLink')}
                            </Text>
                          </Pressable>
                        )
                      : null}
                    <PhoneResetPasswordForm
                      onRequest={async data => requestReset(data)}
                      onConfirm={async (data) => {
                        await confirmReset(data);
                        setPhoneResetSuccess(true);
                      }}
                      isSubmitting={isRequestPending || isConfirmPending}
                      error={error}
                    />
                  </View>
                )
              : (
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
                    <AuthFieldShell>
                      <AuthInput
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder={t('auth.reset_password.newPasswordPlaceholder')}
                        secureTextEntry
                        editable={!isResetting}
                        textAlign={isRTL ? 'right' : 'left'}
                        fontSize={16}
                        letterSpacing={0}
                        testID="reset-new-password"
                      />
                    </AuthFieldShell>
                    <AuthFieldShell>
                      <AuthInput
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder={t('auth.reset_password.confirmPasswordPlaceholder')}
                        secureTextEntry
                        editable={!isResetting}
                        textAlign={isRTL ? 'right' : 'left'}
                        fontSize={16}
                        letterSpacing={0}
                        testID="reset-confirm-password"
                      />
                    </AuthFieldShell>
                    <PressButton
                      variant="gradient"
                      size="lg"
                      fullWidth
                      loading={isResetting}
                      onPress={() => void handleReset()}
                      label={t('auth.reset_password.submit')}
                      trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.white} />}
                      testID="reset-submit-button"
                    />
                  </View>
                )}

            {/* Spacer */}
            <View style={{ flex: 1, minHeight: 16 }} />

            <Text
              style={{
                color: colors.neutral.inkMuted,
                fontSize: 11,
                lineHeight: 16,
                fontWeight: '500',
                textAlign: 'center',
                marginTop: 16,
                marginBottom: Math.max(insets.bottom, 12),
              }}
            >
              {t('auth.login.legalLine', 'By continuing you agree to Taba3ny\'s Terms and Privacy Policy.')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthShell>
  );
}
