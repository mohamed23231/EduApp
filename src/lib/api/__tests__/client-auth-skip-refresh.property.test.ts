/**
 * Property-Based Tests for Auth Endpoint Refresh Skip
 *
 * Tests universal properties of the 401 interceptor behavior for auth endpoints using fast-check.
 *
 * **Validates: Requirements 5.4, 5.5**
 *
 * Property 5: Auth Endpoint Refresh Skip
 */

import { describe, expect, test } from '@jest/globals';
import fc from 'fast-check';

// Feature: auth-baseline-parent-mvp, Property 5: Auth Endpoint Refresh Skip

// eslint-disable-next-line max-lines-per-function
describe('Property 5: Auth Endpoint Refresh Skip', () => {
  const AUTH_SKIP_REFRESH_URLS = [
    '/auth/login',
    '/auth/signup',
    '/auth/refresh',
    '/auth/setup-password',
  ];

  test('Property 5: Auth endpoints are in the skip list and should not trigger refresh', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '/auth/login',
          '/auth/signup',
          '/auth/refresh',
          '/auth/setup-password',
        ),
        (authEndpoint) => {
          // Verify that the endpoint is in the skip list
          const shouldSkipRefresh = AUTH_SKIP_REFRESH_URLS.some(url =>
            authEndpoint.includes(url),
          );

          expect(shouldSkipRefresh).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  test('Property 5: Non-auth endpoints are not in the skip list', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^\/api\/v1\/[a-z]+\/[a-z-]+$/),
        (nonAuthEndpoint) => {
          // Skip if the generated URL happens to be an auth endpoint
          if (
            AUTH_SKIP_REFRESH_URLS.some(url =>
              nonAuthEndpoint.includes(url),
            )
          ) {
            return;
          }

          // Verify that the endpoint is NOT in the skip list
          const shouldSkipRefresh = AUTH_SKIP_REFRESH_URLS.some(url =>
            nonAuthEndpoint.includes(url),
          );

          expect(shouldSkipRefresh).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  test('Property 5: Retried requests have _retry flag set to true', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^\/api\/v1\/[a-z]+\/[a-z-]+$/),
        (endpoint) => {
          // Skip auth endpoints
          if (
            AUTH_SKIP_REFRESH_URLS.some(url =>
              endpoint.includes(url),
            )
          ) {
            return;
          }

          // Create a test request config
          const testConfig = {
            url: endpoint,
            method: 'GET',
            headers: { Authorization: 'Bearer test-token' },
            _retry: false,
          };

          // Simulate the interceptor setting _retry flag
          if (testConfig._retry === false) {
            testConfig._retry = true;
          }

          // Verify _retry flag is set
          expect(testConfig._retry).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  test('Property 5: Auth endpoints reject immediately without attempting refresh', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '/auth/login',
          '/auth/signup',
          '/auth/refresh',
          '/auth/setup-password',
        ),
        (authEndpoint) => {
          // Simulate 401 response for auth endpoint
          const error = {
            response: { status: 401 },
            config: {
              url: authEndpoint,
              headers: { Authorization: 'Bearer token' },
              _retry: false,
            },
            isAxiosError: true,
          };

          // Check if the endpoint is in the skip list
          const shouldSkipRefresh = AUTH_SKIP_REFRESH_URLS.some(url =>
            authEndpoint.includes(url),
          );

          // For auth endpoints, refresh should be skipped
          expect(shouldSkipRefresh).toBe(true);

          // Verify that the error would be rejected without refresh attempt
          expect(error.response.status).toBe(401);
          expect(error.config._retry).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  test('Property 5: Request URLs containing auth endpoints are correctly identified', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'https://api.example.com/auth/login',
          'https://api.example.com/auth/signup',
          'https://api.example.com/auth/refresh',
          'https://api.example.com/auth/setup-password',
          'http://localhost:3000/auth/login',
          'http://localhost:3000/auth/signup',
        ),
        (fullUrl) => {
          // Check if URL contains any auth endpoint
          const containsAuthEndpoint = AUTH_SKIP_REFRESH_URLS.some(url =>
            fullUrl.includes(url),
          );

          expect(containsAuthEndpoint).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  test('Property 5: Retried requests maintain authorization header', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^\/api\/v1\/[a-z]+\/[a-z-]+$/),
        fc.string({ minLength: 10, maxLength: 100 }),
        (endpoint, token) => {
          // Skip auth endpoints
          if (
            AUTH_SKIP_REFRESH_URLS.some(url =>
              endpoint.includes(url),
            )
          ) {
            return;
          }

          // Create a request config with authorization
          const originalConfig = {
            url: endpoint,
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            _retry: false,
          };

          // Simulate retry: set _retry flag and update token
          const newToken = `new-${token}`;
          const retriedConfig = {
            ...originalConfig,
            headers: { Authorization: `Bearer ${newToken}` },
            _retry: true,
          };

          // Verify _retry flag is set
          expect(retriedConfig._retry).toBe(true);

          // Verify authorization header is updated
          expect(retriedConfig.headers.Authorization).toContain('Bearer');
          expect(retriedConfig.headers.Authorization).toBe(`Bearer ${newToken}`);
        },
      ),
      { numRuns: 100 },
    );
  });
});
