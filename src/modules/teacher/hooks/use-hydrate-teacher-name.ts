/**
 * useHydrateTeacherName — best-effort re-fetch of the teacher's full name
 * for accounts created before fullName was persisted. Extracted from
 * dashboard-screen.
 */

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { validateToken } from '@/modules/auth/services';

export function useHydrateTeacherName(user: ReturnType<typeof useAuthStore.use.user>) {
  const token = useAuthStore.use.token();
  const signIn = useAuthStore.use.signIn();
  const hasAttemptedHydrationRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrateMissingName() {
      if (!user || !token) {
        hasAttemptedHydrationRef.current = false;
        return;
      }

      if (user.fullName?.trim()) {
        hasAttemptedHydrationRef.current = false;
        return;
      }

      if (hasAttemptedHydrationRef.current) {
        return;
      }
      hasAttemptedHydrationRef.current = true;

      try {
        const validatedUser = await validateToken();
        if (cancelled || !validatedUser.fullName?.trim()) {
          return;
        }

        signIn({ token, user: { ...user, ...validatedUser } });
      }
      catch {
        // Best-effort hydration for sessions created before fullName was persisted.
      }
    }

    void hydrateMissingName();

    return () => {
      cancelled = true;
    };
  }, [signIn, token, user]);
}
