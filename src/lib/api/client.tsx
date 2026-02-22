import axios from 'axios';
import Env from 'env';
import { getToken } from '@/lib/auth/utils';
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

function applyCommonRequestHeaders(instance: typeof client) {
  instance.interceptors.request.use((config) => {
    const language = getLanguage() ?? 'en';
    config.headers.set('X-Language', language);

    const token = getToken();
    if (token?.access) {
      config.headers.set('Authorization', `Bearer ${token.access}`);
    }

    return config;
  });
}

applyCommonRequestHeaders(client);
applyCommonRequestHeaders(authClient);
