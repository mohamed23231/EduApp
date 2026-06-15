import type { GoogleLoginResponseSuccess } from '../types';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserRole } from '@/core/auth/roles';
import { getHomeRouteForRole } from '@/core/auth/routing';
import { AppRoute } from '@/core/navigation/routes';
import { setOnboardingContext, useAuthStore } from '@/features/auth/use-auth-store';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import { googleAuthService } from '../services';

type GoogleLoginData = GoogleLoginResponseSuccess['data'];

type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
};

function onboardingRoleFor(role: UserRole): 'TEACHER' | 'PARENT' | 'MANAGER' | undefined {
  if (role === UserRole.TEACHER || role === UserRole.PARENT || role === UserRole.MANAGER) {
    return role;
  }
  return undefined;
}

/**
 * Google sign-in flow for the login screen. Extracted from `login-screen.tsx`
 * to keep the screen wrapper under the 300-line cap. The OAuth error paths are
 * NOT credential-enumeration paths, so they surface the specific `AUTH_GOOGLE_*`
 * code via `setError` (inline) rather than the merged credential matrix.
 */
export function useGoogleLogin(setError: (msg: string | null) => void) {
  const router = useRouter();
  const { t } = useTranslation();
  const signIn = useAuthStore.use.signIn();
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  const translateGoogleError = useCallback(
    (error: unknown) =>
      getApiErrorMessage(error, t('auth.login.genericError'), code =>
        t(`auth.errors.${code}`, { defaultValue: '' })),
    [t],
  );

  const routeAfterGoogle = useCallback(
    (data: GoogleLoginData, authUser: AuthUser) => {
      const token = { access: data.accessToken, refresh: data.refreshToken };
      if (!data.onboardingRequired) {
        signIn({ token, user: authUser });
        router.replace(getHomeRouteForRole(authUser.role));
        return;
      }
      const role = onboardingRoleFor(authUser.role);
      setOnboardingContext({
        email: authUser.email,
        fullName: data.user.fullName,
        ...(role ? { role } : {}),
      });
      signIn({ token, user: null });
      router.replace(role === UserRole.MANAGER ? AppRoute.manager.setup : AppRoute.auth.onboarding);
    },
    [router, signIn],
  );

  const handleGoogleSignIn = useCallback(
    async (idToken: string) => {
      setError(null);
      setIsGoogleSigningIn(true);
      try {
        const response = await googleAuthService.googleLogin(idToken);
        if (!response.success && response.code === 'AUTH_SIGNUP_REQUIRED') {
          const prefillEmail = response.data?.prefillEmail ?? '';
          if (prefillEmail)
            setOnboardingContext({ email: prefillEmail });
          router.push({ pathname: AppRoute.auth.signup as never, params: { prefillEmail, idToken } });
          return;
        }
        if (!response.success || !response.data) {
          throw new Error(response.message || t('auth.login.genericError'));
        }
        routeAfterGoogle(response.data, {
          id: response.data.user.id,
          email: response.data.user.email,
          role: response.data.user.role as UserRole,
          fullName: response.data.user.fullName,
        });
      }
      catch (error) {
        setError(translateGoogleError(error));
      }
      finally {
        setIsGoogleSigningIn(false);
      }
    },
    [router, routeAfterGoogle, setError, t, translateGoogleError],
  );

  const handleGoogleSignInError = useCallback(
    (error: Error) => setError(translateGoogleError(error)),
    [setError, translateGoogleError],
  );

  return { handleGoogleSignIn, handleGoogleSignInError, isGoogleSigningIn };
}
