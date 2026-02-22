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
import { getItem, removeItem, setItem } from '@/lib/storage';
import { createSelectors } from '@/lib/utils';

// ─── Onboarding types ────────────────────────────────────────────────────────

export type OnboardingContext = {
  role?: 'TEACHER' | 'PARENT';
  email: string;
  fullName?: string;
};

export type DraftData = {
  phone?: string;
};

// ─── MMKV keys ───────────────────────────────────────────────────────────────

const ONBOARDING_CONTEXT = 'onboarding_context';
const DRAFT_DATA = 'draft_data';

// ─── Store types ─────────────────────────────────────────────────────────────

type SignInPayload = {
  token: TokenType;
  user: AuthUserType | null;
};

type AuthState = {
  token: TokenType | null;
  user: AuthUserType | null;
  status: 'idle' | 'signOut' | 'signIn';
  onboardingContext: OnboardingContext | null;
  signIn: (data: SignInPayload) => void;
  signOut: () => void;
  hydrate: () => void;
  setOnboardingContext: (ctx: OnboardingContext) => void;
  clearOnboardingContext: () => void;
  setDraftData: (draft: DraftData) => void;
  clearDraftData: () => void;
  getDraftData: () => DraftData | null;
};

const _useAuthStore = create<AuthState>((set, get) => ({
  // Default to signed-out so protected layouts never render a blank idle state.
  status: 'signOut',
  token: null,
  user: null,
  onboardingContext: null,

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
      const onboardingContext = getItem<OnboardingContext>(ONBOARDING_CONTEXT);

      if (userToken !== null) {
        // If tokens exist but no user and onboarding context is present,
        // restore the onboarding-pending state (signIn with user: null).
        if (user === null && onboardingContext !== null) {
          set({ status: 'signIn', token: userToken, user: null, onboardingContext });
        }
        else {
          set({ status: 'signIn', token: userToken, user, onboardingContext });
        }
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

  setOnboardingContext: (ctx: OnboardingContext) => {
    setItem<OnboardingContext>(ONBOARDING_CONTEXT, ctx);
    set({ onboardingContext: ctx });
  },

  clearOnboardingContext: () => {
    removeItem(ONBOARDING_CONTEXT);
    set({ onboardingContext: null });
  },

  setDraftData: (draft: DraftData) => {
    setItem<DraftData>(DRAFT_DATA, draft);
  },

  clearDraftData: () => {
    removeItem(DRAFT_DATA);
  },

  getDraftData: (): DraftData | null => {
    return getItem<DraftData>(DRAFT_DATA);
  },
}));

export const useAuthStore = createSelectors(_useAuthStore);

export const signOut = () => _useAuthStore.getState().signOut();
export const signIn = (data: SignInPayload) => _useAuthStore.getState().signIn(data);
export const hydrateAuth = () => _useAuthStore.getState().hydrate();
export function setOnboardingContext(ctx: OnboardingContext) {
  return _useAuthStore.getState().setOnboardingContext(ctx);
}
export function clearOnboardingContext() {
  return _useAuthStore.getState().clearOnboardingContext();
}
export function setDraftData(draft: DraftData) {
  return _useAuthStore.getState().setDraftData(draft);
}
export const clearDraftData = () => _useAuthStore.getState().clearDraftData();
export const getDraftData = () => _useAuthStore.getState().getDraftData();
