import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { googleAuthService } from '../services/google-auth.service';

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

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.successText}>{t('auth.reset_password.success')}</Text>
          <Pressable style={styles.button} onPress={() => router.replace('/login' as any)}>
            <Text style={styles.buttonText}>{t('auth.login.submit')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!tokenData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t('auth.reset_password.expiredToken')}</Text>
          <Pressable style={styles.button} onPress={() => router.replace('/login' as any)}>
            <Text style={styles.buttonText}>{t('auth.login.submit')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>{t('auth.reset_password.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.reset_password.subtitle')}</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('auth.reset_password.newPasswordLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('auth.reset_password.newPasswordPlaceholder')}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoComplete="new-password"
                editable={!isResetting}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('auth.reset_password.confirmPasswordLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('auth.reset_password.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="new-password"
                editable={!isResetting}
              />
            </View>
            {error
              ? <Text style={styles.errorText}>{error}</Text>
              : null}
            <Pressable
              style={[styles.button, isResetting && styles.buttonDisabled]}
              onPress={handleReset}
              disabled={isResetting}
            >
              {isResetting
                ? <ActivityIndicator color="#FFFFFF" size="small" />
                : <Text style={styles.buttonText}>{t('auth.reset_password.submit')}</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', backgroundColor: '#2563EB', borderRadius: 12, justifyContent: 'center', marginTop: 24, minHeight: 52, width: '100%' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  content: { padding: 24 },
  errorText: { color: '#DC2626', fontSize: 14, marginTop: 8, textAlign: 'center' },
  fieldGroup: { marginBottom: 16 },
  flex: { flex: 1 },
  input: { borderColor: '#E5E7EB', borderRadius: 12, borderWidth: 1, fontSize: 16, marginTop: 6, paddingHorizontal: 16, paddingVertical: 14 },
  label: { color: '#374151', fontSize: 14, fontWeight: '600' },
  safeArea: { backgroundColor: '#FFFFFF', flex: 1 },
  scrollContent: { flexGrow: 1 },
  subtitle: { color: '#6B7280', fontSize: 14, marginBottom: 32, marginTop: 8 },
  successText: { color: '#16A34A', fontSize: 16, marginBottom: 24, textAlign: 'center' },
  title: { color: '#0F172A', fontSize: 24, fontWeight: '700', marginTop: 24 },
});
