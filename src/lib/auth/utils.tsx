import type { UserRole } from '@/core/auth/roles';
import { getItem, removeItem, setItem } from '@/lib/storage';

const TOKEN = 'token';
const AUTH_USER = 'auth_user';

export type TokenType = {
  access: string;
  refresh: string;
};

export type AuthUserType = {
  id: string;
  email: string;
  role: UserRole;
};

export const getToken = () => getItem<TokenType>(TOKEN);
export const removeToken = () => removeItem(TOKEN);
export const setToken = (value: TokenType) => setItem<TokenType>(TOKEN, value);

export const getAuthUser = () => getItem<AuthUserType>(AUTH_USER);
export const setAuthUser = (value: AuthUserType) => setItem<AuthUserType>(AUTH_USER, value);
export const removeAuthUser = () => removeItem(AUTH_USER);
