/**
 * useAppSettings hook
 * Fetches remote, runtime-changeable app settings from the backend and caches
 * them, falling back to configuration-layer defaults when the endpoint is
 * unavailable. This is the single source of truth for values that product may
 * change WITHOUT a mobile release — legal URLs and the (mocked) permission
 * prompt. Mirrors the graceful-fallback pattern of `useFeatureFlags`.
 *
 * Backend contract (optional — mobile degrades gracefully on 404/error):
 *   GET /app-settings -> {
 *     legal?:           { termsUrl?: string; privacyUrl?: string };
 *     permissionPrompt?:{ enabled?: boolean; title?: string; body?: string; cta?: string };
 *   }
 * No schema change is required to ship this; the endpoint can be added later.
 */

import { useQuery } from '@tanstack/react-query';
import { LEGAL_FALLBACK, PERMISSION_PROMPT_FALLBACK } from '@/core/config/app-config';
import { authClient } from '@/lib/api/client';

type RemoteAppSettings = {
  legal?: { termsUrl?: string; privacyUrl?: string };
  permissionPrompt?: { enabled?: boolean; title?: string; body?: string; cta?: string };
};

/**
 * Optional copy overrides supplied by the remote endpoint. When absent, the
 *  consuming component falls back to its own i18n keys (EN+AR).
 */
export type PermissionPromptCopy = {
  title?: string;
  body?: string;
  cta?: string;
};

export type AppSettings = {
  legal: { termsUrl: string; privacyUrl: string };
  permissionPrompt: { enabled: boolean; copy: PermissionPromptCopy };
};

async function fetchAppSettings(): Promise<RemoteAppSettings> {
  try {
    const response = await authClient.get<RemoteAppSettings | { data: RemoteAppSettings }>('/app-settings');
    const data = response.data;
    if (
      data
      && typeof data === 'object'
      && 'data' in data
      && typeof (data as { data?: unknown }).data === 'object'
      && (data as { data?: unknown }).data !== null
    ) {
      return (data as { data: RemoteAppSettings }).data;
    }
    return (data && typeof data === 'object' ? data : {}) as RemoteAppSettings;
  }
  catch {
    // Endpoint may not exist yet — fall back to configuration defaults.
    return {};
  }
}

/**
 * Returns resolved app settings (remote value when present, config fallback
 * otherwise). Never returns hardcoded UI URLs; the prompt stays disabled until
 * the backend explicitly enables it.
 */
export function useAppSettings(): AppSettings {
  const { data = {} } = useQuery<RemoteAppSettings>({
    queryKey: ['app-settings'],
    queryFn: fetchAppSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  return {
    legal: {
      termsUrl: data.legal?.termsUrl ?? LEGAL_FALLBACK.termsUrl,
      privacyUrl: data.legal?.privacyUrl ?? LEGAL_FALLBACK.privacyUrl,
    },
    permissionPrompt: {
      enabled: data.permissionPrompt?.enabled ?? PERMISSION_PROMPT_FALLBACK.enabled,
      copy: {
        title: data.permissionPrompt?.title,
        body: data.permissionPrompt?.body,
        cta: data.permissionPrompt?.cta,
      },
    },
  } satisfies AppSettings;
}
