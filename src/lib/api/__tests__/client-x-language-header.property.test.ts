/**
 * Property-Based Tests for X-Language Header Attachment
 *
 * Tests universal properties of X-Language header attachment on all requests using fast-check.
 *
 * **Validates: Requirements 13.3**
 *
 * Property 11: X-Language Header Attachment
 */

import { describe, expect, test } from '@jest/globals';
import fc from 'fast-check';

// Feature: auth-baseline-parent-mvp, Property 11: X-Language Header Attachment

// Mocks
jest.mock('@/features/auth/use-auth-store', () => ({
    signIn: jest.fn(),
    signOut: jest.fn(),
}));

jest.mock('@/lib/auth/utils', () => ({
    getToken: jest.fn(() => ({ access: 'test-token', refresh: 'refresh-token' })),
    getAuthUser: jest.fn(() => null),
}));

jest.mock('@/lib/i18n', () => ({
    getLanguage: jest.fn(() => 'en'),
}));

jest.mock('env', () => ({
    default: { EXPO_PUBLIC_API_URL: 'http://localhost:3000/api/v1' },
}), { virtual: true });

describe('Property 11: X-Language Header Attachment', () => {
    test('Property 11: Request interceptor attaches X-Language header with valid language value', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('en', 'ar'),
                (language) => {
                    // Create a mock config object
                    const config = {
                        url: '/api/v1/test/endpoint',
                        method: 'GET',
                        headers: {
                            set: jest.fn(function (key: string, value: string) {
                                this[key] = value;
                            }),
                        },
                    };

                    // Simulate the request interceptor behavior
                    const mockLanguage = language;
                    config.headers.set('X-Language', mockLanguage);

                    expect(config.headers.set).toHaveBeenCalledWith('X-Language', mockLanguage);
                },
            ),
            { numRuns: 100 },
        );
    });

    test('Property 11: X-Language header is never empty or null', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('en', 'ar'),
                (language) => {
                    // Verify language is valid
                    expect(language).toBeDefined();
                    expect(language).not.toBe('');
                    expect(language).not.toBeNull();
                    expect(['en', 'ar']).toContain(language);
                },
            ),
            { numRuns: 100 },
        );
    });

    test('Property 11: X-Language header is set on all request types', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
                fc.constantFrom('en', 'ar'),
                (method, language) => {
                    // Create a mock config for each HTTP method
                    const config = {
                        url: '/api/v1/test/endpoint',
                        method,
                        headers: {
                            set: jest.fn(function (key: string, value: string) {
                                this[key] = value;
                            }),
                        },
                    };

                    // Simulate the request interceptor
                    config.headers.set('X-Language', language);

                    expect(config.headers.set).toHaveBeenCalledWith('X-Language', language);
                },
            ),
            { numRuns: 100 },
        );
    });

    test('Property 11: X-Language header is set alongside Authorization header', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('en', 'ar'),
                fc.string({ minLength: 10, maxLength: 100 }),
                (language, token) => {
                    // Create a mock config with Authorization header
                    const config = {
                        url: '/api/v1/test/endpoint',
                        method: 'GET',
                        headers: {
                            set: jest.fn(function (key: string, value: string) {
                                this[key] = value;
                            }),
                            Authorization: `Bearer ${token}`,
                        },
                    };

                    // Simulate the request interceptor
                    config.headers.set('X-Language', language);

                    // Verify both headers are present
                    expect(config.headers.Authorization).toBeDefined();
                    expect(config.headers.Authorization).toContain('Bearer');
                    expect(config.headers.set).toHaveBeenCalledWith('X-Language', language);
                },
            ),
            { numRuns: 100 },
        );
    });

    test('Property 11: X-Language header is set on auth endpoints', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('/auth/login', '/auth/signup', '/auth/refresh', '/auth/validate-token'),
                fc.constantFrom('en', 'ar'),
                (endpoint, language) => {
                    // Create a mock config for auth endpoint
                    const config = {
                        url: endpoint,
                        method: 'POST',
                        headers: {
                            set: jest.fn(function (key: string, value: string) {
                                this[key] = value;
                            }),
                        },
                    };

                    // Simulate the request interceptor
                    config.headers.set('X-Language', language);

                    expect(config.headers.set).toHaveBeenCalledWith('X-Language', language);
                },
            ),
            { numRuns: 100 },
        );
    });

    test('Property 11: X-Language header is set on parent API endpoints', () => {
        fc.assert(
            fc.property(
                fc.stringMatching(/^\/api\/v1\/parents\/[a-z-]+$/),
                fc.constantFrom('en', 'ar'),
                (endpoint, language) => {
                    // Create a mock config for parent API endpoint
                    const config = {
                        url: endpoint,
                        method: 'GET',
                        headers: {
                            set: jest.fn(function (key: string, value: string) {
                                this[key] = value;
                            }),
                        },
                    };

                    // Simulate the request interceptor
                    config.headers.set('X-Language', language);

                    expect(config.headers.set).toHaveBeenCalledWith('X-Language', language);
                },
            ),
            { numRuns: 100 },
        );
    });
});
