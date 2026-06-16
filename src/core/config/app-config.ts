import Env from 'env';

import { UserRole } from '@/core/auth/roles';

export const APP_NAME = 'Taba3ny';
export const API_BASE_URL = Env.EXPO_PUBLIC_API_URL;

export const SUPPORTED_LOCALES = ['en', 'ar'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const PRODUCTION_SURFACES = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
] as const;

export const QA_SURFACES = [UserRole.TEACHER, UserRole.PARENT] as const;

export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

/**
 * Legal link fallbacks. Configuration-layer defaults only — the authoritative
 * values come from the remote `/app-settings` endpoint via `useAppSettings`,
 * so they can be changed without a mobile release. UI code must read URLs
 * through `useAppSettings`, never hardcode them.
 */
export const LEGAL_FALLBACK = {
  termsUrl: 'https://taba3ny.app/legal/terms',
  privacyUrl: 'https://taba3ny.app/legal/privacy',
} as const;

/**
 * Permission-prompt fallback config. The prompt is a temporary, config-gated
 * mock: it stays hidden until the remote `/app-settings` endpoint enables it
 * and (optionally) supplies copy/CTA. Default copy falls back to i18n keys —
 * no product copy is baked into the app.
 */
export const PERMISSION_PROMPT_FALLBACK = {
  enabled: false,
} as const;
