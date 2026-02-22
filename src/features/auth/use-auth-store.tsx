import type { AuthUserType, TokenType } from '@/lib/auth/utils';

import { create } from 'zustand';
import {
  getAuthUser,
  getToken,
  removeAuthUser,
  removeToken,
  setAuthUser,
  setToken,
} from '@/lib/auth/utils';
import { createSelectors } from '@/lib/utils';

type SignInPayload = {
  token: TokenType;
  user: AuthUserType | null;
};

type AuthState = {
  token: TokenType | null;
  user: AuthUserType | null;
  status: 'idle' | 'signOut' | 'signIn';
  signIn: (data: SignInPayload) => void;
  signOut: () => void;
  hydrate: () => void;
};

const _useAuthStore = create<AuthState>((set, get) => ({
  // Default to signed-out so protected layouts never render a blank idle state.
  status: 'signOut',
  token: null,
  user: null,
  signIn: ({ token, user }) => {
    setToken(token);
    if (user) {
      setAuthUser(user);
    }
    else {
      removeAuthUser();
    }
    set({ status: 'signIn', token, user });
  },
  signOut: () => {
    removeToken();
    removeAuthUser();
    set({ status: 'signOut', token: null, user: null });
  },
  hydrate: () => {
    try {
      const userToken = getToken();
      const user = getAuthUser();
      if (userToken !== null) {
        set({ status: 'signIn', token: userToken, user });
      }
      else {
        get().signOut();
      }
    }
    catch (e) {
      console.error(e);
      // Never leave app in idle state on hydration failures.
      get().signOut();
    }
  },
}));

export const useAuthStore = createSelectors(_useAuthStore);

export const signOut = () => _useAuthStore.getState().signOut();
export const signIn = (data: SignInPayload) => _useAuthStore.getState().signIn(data);
export const hydrateAuth = () => _useAuthStore.getState().hydrate();
