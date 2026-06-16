import type { AuthErrorContext, AuthErrorKind } from '../utils/auth-error';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/toast-host';
import { classifyAuthError } from '../utils/auth-error';

type ShowAuthError = (error: unknown, context: AuthErrorContext) => AuthErrorKind;

/**
 * Surfaces auth errors through the locked error matrix.
 *
 * Returns a `showAuthError(error, context)` callback that classifies the error
 * (credential / rate-limited / network / generic) and shows the matching
 * i18n'd message as an error toast. The screen no longer needs to inspect the
 * raw backend message — that's what leaks account existence.
 *
 * The returned `AuthErrorKind` lets callers decide whether to ALSO show an
 * inline message (e.g. signup keeps its inline backend message for the generic
 * "email already in use" case, but relies on the toast for network/rate-limit).
 */
export function useAuthErrorToast(): ShowAuthError {
  const { t } = useTranslation();
  const toast = useToast();

  return useCallback(
    (error, context) => {
      const classified = classifyAuthError(error, context);
      toast.show({
        kind: 'error',
        message: t(classified.messageKey, classified.fallback),
      });
      return classified.kind;
    },
    [t, toast],
  );
}
