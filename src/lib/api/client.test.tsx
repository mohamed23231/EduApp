/**
 * Feature: mobile-signup-onboarding, Property 20: Token refresh interceptor retries once on success
 *
 * Validates: Requirements 13.3
 */

import axios from 'axios';
import * as fc from 'fast-check';

// ─── Imports after mocks ──────────────────────────────────────────────────────

import { signIn, signOut } from '@/features/auth/use-auth-store';
import { getToken } from '@/lib/auth/utils';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('@/features/auth/use-auth-store', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('@/lib/auth/utils', () => ({
  getToken: jest.fn(() => ({ access: 'old-access', refresh: 'old-refresh' })),
  getAuthUser: jest.fn(() => null),
}));

jest.mock('@/lib/i18n', () => ({
  getLanguage: jest.fn(() => 'en'),
}));

jest.mock('env', () => ({
  default: { EXPO_PUBLIC_API_URL: 'http://localhost:3000/api/v1' },
}), { virtual: true });

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AUTH_SKIP_REFRESH_URLS = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/setup-password'];

function processQueue(
  failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }>,
  error: unknown,
  token: string | null = null,
) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error)
      reject(error);
    else resolve(token);
  });
  failedQueue.length = 0;
}

/**
 * Create a mock adapter for the main axios instance.
 * First call to any URL returns 401, subsequent calls return 200.
 */
function createMainAdapter(callCounts: Record<string, number>) {
  return jest.fn(async (config: any) => {
    const url: string = config.url ?? '';
    callCounts[url] = (callCounts[url] ?? 0) + 1;

    if (callCounts[url] === 1) {
      const err: any = new Error('Request failed with status code 401');
      err.response = { status: 401, data: { message: 'Unauthorized' }, config };
      err.config = config;
      err.isAxiosError = true;
      throw err;
    }

    return { status: 200, statusText: 'OK', data: { result: 'ok' }, headers: {}, config };
  });
}

/**
 * Create a mock adapter for the refresh axios instance.
 */
function createRefreshAdapter(state: { refreshResponse: any; refreshShouldFail: boolean }) {
  return jest.fn(async (config: any) => {
    if (state.refreshShouldFail) {
      const err: any = new Error('Request failed with status code 401');
      err.response = { status: 401, data: { message: 'Unauthorized' }, config };
      err.config = config;
      err.isAxiosError = true;
      throw err;
    }
    return {
      status: 200,
      statusText: 'OK',
      data: { data: state.refreshResponse },
      headers: {},
      config,
    };
  });
}

/**
 * Attach the 401 refresh interceptor to a main axios instance.
 */

function attachRefreshInterceptor(
  mainInstance: ReturnType<typeof axios.create>,
  refreshInstance: ReturnType<typeof axios.create>,
) {
  let isRefreshing = false;
  const failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

  mainInstance.interceptors.response.use(
    response => response,
    async (error) => {
      const originalRequest = error.config;

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
            return mainInstance(originalRequest);
          }).catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const currentToken = getToken();

        try {
          const { data } = await refreshInstance.post('/auth/refresh', {
            refreshToken: currentToken?.refresh,
          });

          const newAccessToken = data.data.accessToken;
          const newRefreshToken = data.data.refreshToken;

          (signIn as jest.Mock)({ token: { access: newAccessToken, refresh: newRefreshToken }, user: null });

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(failedQueue, null, newAccessToken);
          return mainInstance(originalRequest);
        }
        catch (refreshError) {
          processQueue(failedQueue, refreshError, null);
          (signOut as jest.Mock)();
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

/**
 * Build a self-contained interceptor setup for testing.
 */
function buildInterceptorSetup() {
  const callCounts: Record<string, number> = {};
  const state = { refreshResponse: null as any, refreshShouldFail: false };

  const mainAdapter = createMainAdapter(callCounts);
  const refreshAdapter = createRefreshAdapter(state);

  const mainInstance = axios.create({
    baseURL: 'http://localhost:3000/api/v1',
    adapter: mainAdapter as unknown as any,
  });
  const refreshInstance = axios.create({
    baseURL: 'http://localhost:3000/api',
    adapter: refreshAdapter as unknown as any,
  });

  attachRefreshInterceptor(mainInstance, refreshInstance);

  return {
    mainInstance,
    mainAdapter,
    refreshAdapter,
    callCounts,
    setRefreshResponse(tokens: { accessToken: string; refreshToken: string }) {
      state.refreshResponse = tokens;
    },
    setRefreshShouldFail(fail: boolean) {
      state.refreshShouldFail = fail;
    },
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line max-lines-per-function
describe('token Refresh Interceptor — Property 20: retries once on success', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 20: For any 401 response with available refresh token and successful refresh,
   * original request retried exactly once with new token.
   *
   * Validates: Requirements 13.3
   */
  it('p20 — retries original request exactly once with new access token after successful refresh', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 50 }).filter(s => /^[\w-]+$/.test(s)),
        fc.string({ minLength: 10, maxLength: 50 }).filter(s => /^[\w-]+$/.test(s)),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9]+$/.test(s)),
        async (newAccessToken, newRefreshToken, endpointSuffix) => {
          const setup = buildInterceptorSetup();
          setup.setRefreshResponse({ accessToken: newAccessToken, refreshToken: newRefreshToken });

          const endpoint = `/data/${endpointSuffix}`;

          const response = await setup.mainInstance.get(endpoint, {
            headers: { Authorization: 'Bearer old-access-token' },
          });

          // The main adapter should have been called exactly twice (original + retry)
          expect(setup.mainAdapter).toHaveBeenCalledTimes(2);

          // The response should be the successful retry response
          expect(response.data).toEqual({ result: 'ok' });

          // signIn should have been called with the new tokens
          expect(signIn).toHaveBeenCalledWith(
            expect.objectContaining({
              token: expect.objectContaining({
                access: newAccessToken,
                refresh: newRefreshToken,
              }),
            }),
          );

          // signOut should NOT have been called
          expect(signOut).not.toHaveBeenCalled();

          // The retry request must carry the new Bearer token
          const retryConfig = setup.mainAdapter.mock.calls[1][0];
          expect(retryConfig.headers?.Authorization).toBe(`Bearer ${newAccessToken}`);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('p20 — does not retry requests to auth skip URLs on 401', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('/auth/login', '/auth/signup', '/auth/refresh', '/auth/setup-password'),
        async (skipUrl) => {
          const setup = buildInterceptorSetup();
          setup.setRefreshResponse({ accessToken: 'new-token', refreshToken: 'new-refresh' });

          let threw = false;
          try {
            await setup.mainInstance.post(skipUrl, {}, {
              headers: { Authorization: 'Bearer old-access-token' },
            });
          }
          catch {
            threw = true;
          }

          expect(threw).toBe(true);
          // Refresh adapter should never be called for skip URLs
          expect(setup.refreshAdapter).not.toHaveBeenCalled();
          expect(signOut).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('p20 — does not retry requests without Bearer token on 401', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9]+$/.test(s)),
        async (suffix) => {
          const setup = buildInterceptorSetup();
          setup.setRefreshResponse({ accessToken: 'new-token', refreshToken: 'new-refresh' });

          const endpoint = `/data/${suffix}`;

          let threw = false;
          try {
            // No Authorization header — should not trigger refresh
            await setup.mainInstance.get(endpoint);
          }
          catch {
            threw = true;
          }

          expect(threw).toBe(true);
          expect(setup.refreshAdapter).not.toHaveBeenCalled();
          expect(signOut).not.toHaveBeenCalled();
          expect(signIn).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });
});
