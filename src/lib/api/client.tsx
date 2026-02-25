/**
 * Centralized API Client
 *
 * Single source of truth for all HTTP communication.
 * - `client`      → general API (baseURL from env, versioned)
 * - `authClient`  → auth-specific endpoints (un-versioned base)
 *
 * Features:
 *  • Automatic Bearer token injection
 *  • Language & timezone headers on every request
 *  • 401 interceptor with silent token refresh + request queue
 *  • Configurable timeout via app-config
 */

import type { AxiosInstance } from 'axios';
import axios from 'axios';
import Env from 'env';
import { DEFAULT_REQUEST_TIMEOUT_MS } from '@/core/config/app-config';
import { signIn, signOut } from '@/features/auth/use-auth-store';
import { getAuthUser, getToken } from '@/lib/auth/utils';
import { getLanguage } from '@/lib/i18n';

// ─── Base URL resolution ──────────────────────────────────────────────────────

const baseURL = Env.EXPO_PUBLIC_API_URL;

function resolveAuthBaseURL(url: string): string {
  if (url.includes('/api/v1')) {
    return url.replace('/api/v1', '/api');
  }
  return url;
}

// ─── Axios instances ──────────────────────────────────────────────────────────

export const client = axios.create({
  baseURL,
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

export const authClient = axios.create({
  baseURL: resolveAuthBaseURL(baseURL),
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Common request headers ───────────────────────────────────────────────────

function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  catch {
    return 'Asia/Riyadh';
  }
}

function applyCommonRequestHeaders(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const language = getLanguage() ?? 'en';
    config.headers.set('X-Language', language);

    const timezone = getDeviceTimezone();
    config.headers.set('X-Timezone', timezone);

    const token = getToken();
    if (token?.access) {
      config.headers.set('Authorization', `Bearer ${token.access}`);
    }

    return config;
  });
}

applyCommonRequestHeaders(client);
applyCommonRequestHeaders(authClient);

// ─── TypeScript declaration for _retry flag ───────────────────────────────────

declare module 'axios' {
  // eslint-disable-next-line ts/consistent-type-definitions
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// ─── Refresh client (no 401 interceptor — avoids recursion) ───────────────────

const refreshClient = axios.create({
  baseURL: resolveAuthBaseURL(baseURL),
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

refreshClient.interceptors.request.use((config) => {
  config.headers['X-Language'] = getLanguage() ?? 'en';
  return config;
});

// ─── Token refresh queue ──────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const AUTH_SKIP_REFRESH_URLS = [
  '/auth/login',
  '/auth/signup',
  '/auth/refresh',
  '/auth/setup-password',
];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    }
    else {
      resolve(token);
    }
  });
  failedQueue = [];
}

// ─── 401 interceptor with silent refresh ──────────────────────────────────────

function apply401Interceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    response => response,
    async (error) => {
      const originalRequest = error.config;

      // Skip refresh for auth endpoints to prevent loops
      if (AUTH_SKIP_REFRESH_URLS.some(url => originalRequest?.url?.includes(url))) {
        return Promise.reject(error);
      }

      const hadBearerToken = originalRequest?.headers?.Authorization?.toString().startsWith('Bearer ');

      if (error.response?.status === 401 && !originalRequest?._retry && hadBearerToken) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          }).catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const currentToken = getToken();

        try {
          const { data } = await refreshClient.post('/auth/refresh', {
            refreshToken: currentToken?.refresh,
          });

          const newAccessToken = data.data.accessToken;
          const newRefreshToken = data.data.refreshToken;

          signIn({
            token: { access: newAccessToken, refresh: newRefreshToken },
            user: getAuthUser(),
          });

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return instance(originalRequest);
        }
        catch (refreshError) {
          processQueue(refreshError, null);
          signOut();
          return Promise.reject(refreshError);
        }
        finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );
}

apply401Interceptor(client);
apply401Interceptor(authClient);
