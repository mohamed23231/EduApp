import type { UserRole } from '@/core/auth/roles';
import { getItem, removeItem, setItem } from '@/lib/storage';

const TOKEN = 'token';
const AUTH_USER = 'auth_user';
const ONBOARDING_CONTEXT = 'onboarding_context';

export type TokenType = {
  access: string;
  refresh: string;
};

export type AuthUserType = {
  id: string;
  email: string;
  role: UserRole;
};

export type OnboardingContext = {
  role?: 'TEACHER' | 'PARENT';
  email: string;
  fullName?: string;
};

export const getToken = () => getItem<TokenType>(TOKEN);
export const removeToken = () => removeItem(TOKEN);
export const setToken = (value: TokenType) => setItem<TokenType>(TOKEN, value);

export const getAuthUser = () => getItem<AuthUserType>(AUTH_USER);
export const setAuthUser = (value: AuthUserType) => setItem<AuthUserType>(AUTH_USER, value);
export const removeAuthUser = () => removeItem(AUTH_USER);

export const getOnboardingContext = () => getItem<OnboardingContext>(ONBOARDING_CONTEXT);
export const setOnboardingContext = (value: OnboardingContext) => setItem<OnboardingContext>(ONBOARDING_CONTEXT, value);
export const removeOnboardingContext = () => removeItem(ONBOARDING_CONTEXT);

/**
 * Decode JWT token and extract expiry time
 * Returns expiry timestamp in milliseconds, or null if token is invalid
 */
export function getTokenExpiry(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3)
      return null;

    const decoded = JSON.parse(atob(parts[1]));
    return decoded.exp ? decoded.exp * 1000 : null;
  }
  catch {
    return null;
  }
}

/**
 * Check if token expires within the specified seconds
 * Returns true if token expires within the threshold, false otherwise
 */
export function isTokenExpiringWithin(token: string, secondsThreshold: number): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry)
    return false;

  const now = Date.now();
  const thresholdMs = secondsThreshold * 1000;
  return expiry - now <= thresholdMs;
}
