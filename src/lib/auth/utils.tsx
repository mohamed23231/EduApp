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
