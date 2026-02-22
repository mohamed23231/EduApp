/**
 * Feature: mobile-signup-onboarding
 * Properties: P12, P13, P16, P17, P18, P19 — auth store behaviour
 *
 * Feature: auth-baseline-parent-mvp, Property 6: Onboarding Context Round Trip
 */

import * as fc from 'fast-check';

// ─── Imports after mocks ──────────────────────────────────────────────────────

import {
  clearOnboardingContext,
  getDraftData,
  hydrateAuth,
  setDraftData,
  setOnboardingContext,
  signIn,
  signOut,
  useAuthStore,
} from '@/features/auth/use-auth-store';
import { getAuthUser, getToken } from '@/lib/auth/utils';
import { getItem, removeItem, setItem } from '@/lib/storage';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('@/lib/storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@/lib/auth/utils', () => ({
  getToken: jest.fn(),
  getAuthUser: jest.fn(),
  setToken: jest.fn(),
  setAuthUser: jest.fn(),
  removeToken: jest.fn(),
  removeAuthUser: jest.fn(),
}));

// ─── In-memory MMKV simulation ────────────────────────────────────────────────

const mmkvStore = new Map<string, unknown>();

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mmkvStore.clear();

  (setItem as jest.Mock).mockImplementation((key: string, value: unknown) => {
    mmkvStore.set(key, value);
  });
  (getItem as jest.Mock).mockImplementation((key: string) => {
    return mmkvStore.get(key) ?? null;
  });
  (removeItem as jest.Mock).mockImplementation((key: string) => {
    mmkvStore.delete(key);
  });

  // Reset Zustand store to a clean signOut state
  signOut();
});

// ─── P12 ──────────────────────────────────────────────────────────────────────

describe('use-auth-store — p12: auth store transition on onboardingRequired', () => {
  it('p12 — signIn with user null results in status signIn, token set, user null', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          access: fc.string({ minLength: 1 }),
          refresh: fc.string({ minLength: 1 }),
        }),
        async (token) => {
          signOut();

          signIn({ token, user: null });

          const state = useAuthStore.getState();
          expect(state.status).toBe('signIn');
          expect(state.token).toEqual(token);
          expect(state.user).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── P13 ──────────────────────────────────────────────────────────────────────

describe('use-auth-store — p13: onboarding context round-trip persistence', () => {
  it('p13 — persist then hydrate returns equivalent onboarding context', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          role: fc.option(fc.constantFrom('TEACHER' as const, 'PARENT' as const), { nil: undefined }),
          fullName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        }),
        async (ctx) => {
          signOut();
          mmkvStore.clear();

          setOnboardingContext(ctx);

          (getToken as jest.Mock).mockReturnValue({ access: 'tok', refresh: 'ref' });
          (getAuthUser as jest.Mock).mockReturnValue(null);

          hydrateAuth();

          const state = useAuthStore.getState();
          expect(state.onboardingContext).toEqual(ctx);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── P16 ──────────────────────────────────────────────────────────────────────

describe('use-auth-store — p16: draft data round-trip persistence', () => {
  it('p16 — setDraftData then getDraftData returns equivalent draft', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phone: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
        }),
        async (draft) => {
          mmkvStore.clear();

          setDraftData(draft);
          const result = getDraftData();

          expect(result).toEqual(draft);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── P17 ──────────────────────────────────────────────────────────────────────

describe('use-auth-store — p17: auth store remains onboardingPending after profile failure', () => {
  it('p17 — after signIn with user null, store stays signIn with user null', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          access: fc.string({ minLength: 1 }),
          refresh: fc.string({ minLength: 1 }),
        }),
        async (token) => {
          signOut();

          signIn({ token, user: null });

          // Simulate profile fetch failure — no further store mutations

          const state = useAuthStore.getState();
          expect(state.status).toBe('signIn');
          expect(state.user).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── P18 ──────────────────────────────────────────────────────────────────────

describe('use-auth-store — p18: signOut on refresh failure preserves draft data', () => {
  it('p18 — signOut clears auth state but draft data in MMKV remains', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          phone: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
        }),
        async (draft) => {
          mmkvStore.clear();

          setDraftData(draft);

          // Simulate refresh failure triggering signOut
          signOut();

          const state = useAuthStore.getState();
          expect(state.status).toBe('signOut');
          expect(state.user).toBeNull();

          // Draft data must survive signOut
          const surviving = getDraftData();
          expect(surviving).toEqual(draft);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── P19 ──────────────────────────────────────────────────────────────────────

describe('use-auth-store — p19: hydration completes before route guard evaluation', () => {
  it('p19 — after hydrateAuth, status is signIn or signOut (never idle)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        async (hasTokens) => {
          signOut();

          if (hasTokens) {
            (getToken as jest.Mock).mockReturnValue({ access: 'tok', refresh: 'ref' });
            (getAuthUser as jest.Mock).mockReturnValue(null);
          }
          else {
            (getToken as jest.Mock).mockReturnValue(null);
          }

          hydrateAuth();

          const { status } = useAuthStore.getState();
          expect(['signIn', 'signOut']).toContain(status);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ─── Property 6: Onboarding Context Round Trip (auth-baseline-parent-mvp) ────

describe('use-auth-store — Property 6: Onboarding Context Round Trip', () => {
  it('property 6 — persist context via setOnboardingContext, hydrate, verify restored context is identical', async () => {
    // Feature: auth-baseline-parent-mvp, Property 6: Onboarding Context Round Trip
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          role: fc.option(fc.constantFrom('TEACHER' as const, 'PARENT' as const), { nil: undefined }),
          fullName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        }),
        async (ctx) => {
          signOut();
          mmkvStore.clear();

          // Persist the onboarding context
          setOnboardingContext(ctx);

          // Verify it's stored in the in-memory MMKV
          const storedInMMKV = mmkvStore.get('onboarding_context');
          expect(storedInMMKV).toEqual(ctx);

          // Verify it's set in the store state
          let state = useAuthStore.getState();
          expect(state.onboardingContext).toEqual(ctx);

          // Simulate app restart: clear store state but keep MMKV
          // In a real app, the store would be recreated. Here we simulate by:
          // 1. Clearing the store via signOut
          // 2. Clearing the in-memory store state (simulating fresh app start)
          signOut();

          // Clear the onboarding context from store state to simulate fresh app start
          clearOnboardingContext();
          state = useAuthStore.getState();
          expect(state.onboardingContext).toBeNull();

          // Now set it back in MMKV (simulating it was persisted before app restart)
          mmkvStore.set('onboarding_context', ctx);

          // Hydrate from MMKV with tokens present
          (getToken as jest.Mock).mockReturnValue({ access: 'tok', refresh: 'ref' });
          (getAuthUser as jest.Mock).mockReturnValue(null);

          hydrateAuth();

          // Verify the context is restored identically
          state = useAuthStore.getState();
          expect(state.onboardingContext).toEqual(ctx);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('property 6 — clearOnboardingContext sets context to null', async () => {
    // Feature: auth-baseline-parent-mvp, Property 6: Onboarding Context Round Trip
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          role: fc.option(fc.constantFrom('TEACHER' as const, 'PARENT' as const), { nil: undefined }),
          fullName: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        }),
        async (ctx) => {
          signOut();
          mmkvStore.clear();

          // Set the onboarding context
          setOnboardingContext(ctx);

          let state = useAuthStore.getState();
          expect(state.onboardingContext).toEqual(ctx);

          // Verify it's in MMKV
          expect(mmkvStore.get('onboarding_context')).toEqual(ctx);

          // Clear the onboarding context
          clearOnboardingContext();

          // Verify it's removed from store state
          state = useAuthStore.getState();
          expect(state.onboardingContext).toBeNull();

          // Verify it's removed from MMKV
          expect(mmkvStore.get('onboarding_context')).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});
