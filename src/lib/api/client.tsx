import type { AxiosInstance } from 'axios';
import axios from 'axios';
import Env from 'env';
import { signIn, signOut } from '@/features/auth/use-auth-store';
import { getAuthUser, getToken } from '@/lib/auth/utils';
import { getLanguage } from '@/lib/i18n';

const baseURL = Env.EXPO_PUBLIC_API_URL;

function resolveAuthBaseURL(url: string) {
  if (url.includes('/api/v1')) {
    return url.replace('/api/v1', '/api');
  }

  return url;
}

export const client = axios.create({
  baseURL,
});

export const authClient = axios.create({
  baseURL: resolveAuthBaseURL(baseURL),
});

function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  catch {
    return 'Asia/Riyadh'; // fallback default
  }
}

function applyCommonRequestHeaders(instance: typeof client) {
  instance.interceptors.request.use((config) => {
    const language = getLanguage() ?? 'en';
    config.headers.set('X-Language', language);

    // Add device timezone for authenticated parent requests
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

// ─── Bare client for refresh calls only — no 401 interceptor to avoid recursion

const refreshClient = axios.create({ baseURL: resolveAuthBaseURL(baseURL) });
refreshClient.interceptors.request.use((config) => {
  config.headers['X-Language'] = getLanguage() ?? 'en';
  return config;
});

// ─── Refresh queue state ──────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

// ─── Auth endpoints that should never trigger a refresh attempt ───────────────

const AUTH_SKIP_REFRESH_URLS = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/setup-password'];

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

function apply401Interceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    response => response,
    async (error) => {
      const originalRequest = error.config;

      // Skip refresh for auth endpoints to prevent loops
      if (AUTH_SKIP_REFRESH_URLS.some(url => originalRequest?.url?.includes(url))) {
        return Promise.reject(error);
      }

      // Only attempt refresh if original request had a Bearer token
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

          // Update tokens in store, preserving current user
          signIn({ token: { access: newAccessToken, refresh: newRefreshToken }, user: getAuthUser() });

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
