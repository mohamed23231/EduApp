import Env from 'env';

import { UserRole } from '@/core/auth/roles';

export const APP_NAME = 'Privat Edu';
export const API_BASE_URL = Env.EXPO_PUBLIC_API_URL;

export const SUPPORTED_LOCALES = ['en', 'ar'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const PRODUCTION_SURFACES = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
] as const;

export const QA_SURFACES = [UserRole.TEACHER, UserRole.PARENT] as const;

export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;
