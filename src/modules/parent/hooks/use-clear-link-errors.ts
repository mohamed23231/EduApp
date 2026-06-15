import { useEffect, useRef } from 'react';

/**
 * Clears the link-student validation + mutation errors whenever the access code
 * changes, so a stale "invalid code" message doesn't linger while the user
 * edits. Extracted from the screen to keep the wrapper under the line cap.
 */
export function useClearLinkErrors({
  accessCode,
  validationError,
  hasMutationError,
  resetMutationError,
  setValidationError,
}: {
  accessCode: string;
  validationError: string | null;
  hasMutationError: boolean;
  resetMutationError: (() => void) | undefined;
  setValidationError: (error: string | null) => void;
}) {
  const previousAccessCode = useRef(accessCode);

  useEffect(() => {
    const hasChanged = accessCode !== previousAccessCode.current;
    previousAccessCode.current = accessCode;
    if (!hasChanged)
      return;

    if (validationError)
      setValidationError(null);

    if (hasMutationError)
      resetMutationError?.();
  }, [accessCode, validationError, hasMutationError, resetMutationError, setValidationError]);
}
