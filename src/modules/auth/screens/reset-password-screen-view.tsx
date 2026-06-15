import type { useRouter } from 'expo-router';
import type { TFunction } from 'i18next';
import type {
  PhoneResetPasswordConfirmParams,
  PhoneResetPasswordRequestParams,
} from '../types';
import type { ResetTokenData } from './reset-password-screen';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
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
  Icon,
  PressButton,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { useSelectedLanguage } from '@/lib/i18n';
import { AuthHero } from '../components/auth-hero';
import { AuthTopBar } from '../components/auth-top-bar';
import { PhoneResetPasswordForm } from '../components/phone-reset-password-form';

export type ResetPasswordViewProps = {
  router: ReturnType<typeof useRouter>;
  t: TFunction;
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
  requestReset: (data: PhoneResetPasswordRequestParams) => Promise<void>;
  confirmReset: (data: PhoneResetPasswordConfirmParams) => Promise<void>;
};

function ResetSuccessView({ t, onContinue }: { t: TFunction; onContinue: () => void }) {
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
            onPress={onContinue}
            label={t('auth.login.submit')}
            trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.white} />}
            testID="reset-success-login-button"
          />
        </View>
      </View>
    </AuthShell>
  );
}

// eslint-disable-next-line max-lines-per-function
export function ResetPasswordView({
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
  const { language } = useSelectedLanguage();
  const isRTL = language === 'ar';

  if (phoneResetSuccess || success) {
    return <ResetSuccessView t={t} onContinue={() => router.replace('/login' as never)} />;
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
          <AuthTopBar onBack={() => router.back()} backTestID="reset-back-button" />

          <AuthHero
            line1={heroLine1}
            line2={heroLine2}
            subtitle={isPhoneFlow ? t('auth.phone.resetSubtitle') : t('auth.reset_password.subtitle')}
            isRTL={isRTL}
          />

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
                      onRequest={data => requestReset(data)}
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
