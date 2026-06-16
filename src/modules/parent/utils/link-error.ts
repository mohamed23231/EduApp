import type { TFunction } from 'i18next';
import type { ApiErrorEnvelope } from '@/shared/types/api';
import { isAxiosError } from '../services/error-utils';

/**
 * Distinguishes an *invalid* access code from an *expired/revoked* one, per the
 * Parent States Pass ("invalid ≠ expired code"). The backend exposes this two
 * ways depending on the code source:
 *   - org/independent path → `DomainException` with `code`
 *     (`PARENT_ACCESS_CODE_INVALID` / `PARENT_ACCESS_CODE_REVOKED`)
 *   - unified path → plain 404 with an English message
 *     ("Access code not found" = invalid · "no longer valid" = expired)
 * We prefer the structured `code`, then fall back to the message text.
 */

export type LinkErrorReason = 'invalid' | 'expired' | 'offline' | 'generic';

export function classifyLinkError(error: unknown): LinkErrorReason {
  if (!isAxiosError(error))
    return 'generic';

  if (!error.response)
    return 'offline';

  const envelope = error.response.data as ApiErrorEnvelope | undefined;
  const code = envelope?.code;
  if (code === 'PARENT_ACCESS_CODE_INVALID')
    return 'invalid';
  if (code === 'PARENT_ACCESS_CODE_REVOKED')
    return 'expired';

  const message = (envelope?.message ?? '').toLowerCase();
  if (message.includes('no longer valid') || message.includes('revoked') || message.includes('expired'))
    return 'expired';
  if (message.includes('not found') || message.includes('invalid'))
    return 'invalid';

  return 'generic';
}

export function linkErrorMessage(reason: LinkErrorReason, t: TFunction): string {
  switch (reason) {
    case 'invalid':
      return t('parent.linkStudent.errorInvalid', 'That code isn\'t valid. Double-check it and try again.');
    case 'expired':
      return t('parent.linkStudent.errorExpired', 'That code has expired. Ask your tutor for a new one.');
    case 'offline':
      return t('parent.common.offlineError', 'No internet connection. Please check your network and try again.');
    case 'generic':
    default:
      return t('parent.common.genericError', 'Something went wrong. Please try again.');
  }
}
