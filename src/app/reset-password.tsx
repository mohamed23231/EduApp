import type { ResetTokenData } from '@/modules/auth/screens/reset-password-screen';
import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import { ResetPasswordScreen } from '@/modules/auth/screens/reset-password-screen';

/**
 * Reset Password Route
 *
 * Expo Router file-based route for /reset-password deep links.
 * Parses token from URL params and renders ResetPasswordScreen.
 *
 * Supports:
 * - Code-based: /reset-password?code=<recovery_code>
 * - Fragment-based: /reset-password?access_token=<jwt>&refresh_token=<rt>
 *
 * Requirements: 7.1, 7.2, 11.1.1
 */
export default function ResetPasswordRoute() {
  const params = useLocalSearchParams<{
    code?: string;
    access_token?: string;
    refresh_token?: string;
  }>();

  const tokenData = React.useMemo<ResetTokenData | null>(() => {
    // Code flow takes precedence over fragment flow
    if (params.code) {
      return { type: 'code', code: params.code };
    }
    if (params.access_token && params.refresh_token) {
      return {
        type: 'fragment',
        accessToken: params.access_token,
        refreshToken: params.refresh_token,
      };
    }
    return null;
  }, [params.code, params.access_token, params.refresh_token]);

  return <ResetPasswordScreen tokenData={tokenData} />;
}
