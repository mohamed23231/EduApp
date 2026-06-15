import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/toast-host';
import { useAuthErrorToast } from '../hooks/use-auth-error-toast';
import { usePhoneResetPasswordConfirm, usePhoneResetPasswordRequest } from '../hooks/use-phone-reset-password';
import { googleAuthService } from '../services/google-auth.service';
import { ResetPasswordView } from './reset-password-screen-view';

export type ResetTokenData
  = | { type: 'code'; code: string }
    | { type: 'fragment'; accessToken: string; refreshToken: string };

type ResetPasswordScreenProps = {
  tokenData: ResetTokenData | null;
};

export function ResetPasswordScreen({ tokenData }: ResetPasswordScreenProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const showAuthError = useAuthErrorToast();
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
      toast.show({ kind: 'success', message: t('auth.reset_password.success') });
      setSuccess(true);
    }
    catch (err) {
      // Network / rate-limit get a distinct transient toast; an invalid/expired
      // token (the common 4xx here) stays inline as the expired-token message.
      const kind = showAuthError(err, 'reset');
      if (kind === 'generic') {
        setError(t('auth.reset_password.expiredToken'));
      }
    }
    finally {
      setIsResetting(false);
    }
  };

  return (
    <ResetPasswordView
      router={router}
      t={t}
      tokenData={tokenData}
      resetMode={resetMode}
      setResetMode={setResetMode}
      newPassword={newPassword}
      setNewPassword={setNewPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      handleReset={handleReset}
      isResetting={isResetting}
      error={error}
      success={success}
      phoneResetSuccess={phoneResetSuccess}
      setPhoneResetSuccess={setPhoneResetSuccess}
      isRequestPending={isRequestPending}
      isConfirmPending={isConfirmPending}
      requestReset={requestReset}
      confirmReset={confirmReset}
    />
  );
}
