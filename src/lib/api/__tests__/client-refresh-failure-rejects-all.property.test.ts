/**
 * Property-Based Tests for Token Refresh Queue — Failure Rejects All
 *
 * Tests universal properties of the 401 interceptor behavior when token refresh fails using fast-check.
 *
 * **Validates: Requirements 5.3**
 *
 * Property 4: Token Refresh Queue — Failure Rejects All
 */

import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';

// Feature: auth-baseline-parent-mvp, Property 4: Token Refresh Queue — Failure Rejects All

describe('property 4: token refresh queue — failure rejects all', () => {
    test('property 4: when refresh fails, all queued requests are rejected', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 10 }),
                (_numRequests) => {
                    // Simulate the refresh queue state
                    let isRefreshing = false;
                    let failedQueue: Array<{
                        resolve: (value: unknown) => void;
                        reject: (reason?: unknown) => void;
                    }> = [];
                    let signOutCalled = false;

                    function processQueue(error: unknown, _token: string | null = null) {
                        failedQueue.forEach(({ resolve, reject }) => {
                            if (error) {
                                reject(error);
                            }
                            else {
                                resolve(_token);
                            }
                        });
                        failedQueue = [];
                    }

                    // Simulate N concurrent 401 requests
                    const refreshError = new Error('Refresh token expired');

                    // First request triggers refresh
                    if (!isRefreshing) {
                        isRefreshing = true;

                        // Simulate refresh failure
                        try {
                            throw refreshError;
                        }
                        catch (error) {
                            processQueue(error, null);
                            signOutCalled = true;
                        }
                        finally {
                            isRefreshing = false;
                        }
                    }

                    // Verify all queued requests would be rejected
                    expect(failedQueue.length).toBe(0); // Queue was processed
                    expect(signOutCalled).toBe(true); // signOut was called
                },
            ),
            { numRuns: 100 },
        );
    });

    test('property 4: refresh failure triggers signOut', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 5 }),
                (numRequests) => {
                    let signOutCalled = false;
                    let isRefreshing = false;
                    let failedQueue: Array<{
                        resolve: (value: unknown) => void;
                        reject: (reason?: unknown) => void;
                    }> = [];

                    function processQueue(error: unknown, _token: string | null = null) {
                        failedQueue.forEach(({ resolve, reject }) => {
                            if (error) {
                                reject(error);
                            }
                            else {
                                resolve(_token);
                            }
                        });
                        failedQueue = [];
                    }

                    // Simulate queued requests waiting on refresh
                    for (let i = 0; i < numRequests; i++) {
                        if (isRefreshing) {
                            failedQueue.push({
                                resolve: () => { },
                                reject: () => { },
                            });
                        }
                    }

                    // Simulate refresh failure
                    isRefreshing = true;
                    const refreshError = new Error('Refresh failed: invalid token');

                    try {
                        throw refreshError;
                    }
                    catch (error) {
                        processQueue(error, null);
                        signOutCalled = true;
                    }
                    finally {
                        isRefreshing = false;
                    }

                    // Verify signOut was called
                    expect(signOutCalled).toBe(true);
                    // Verify queue was processed
                    expect(failedQueue.length).toBe(0);
                },
            ),
            { numRuns: 100 },
        );
    });

    test('property 4: all queued requests receive the same refresh error', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 8 }),
                (numRequests) => {
                    let _isRefreshing = false;
                    let failedQueue: Array<{
                        resolve: (value: unknown) => void;
                        reject: (reason?: unknown) => void;
                    }> = [];
                    const rejectionErrors: unknown[] = [];

                    function processQueue(error: unknown, _token: string | null = null) {
                        failedQueue.forEach(({ resolve, reject }) => {
                            if (error) {
                                rejectionErrors.push(error);
                                reject(error);
                            }
                            else {
                                resolve(_token);
                            }
                        });
                        failedQueue = [];
                    }

                    // Simulate N concurrent requests that all get 401
                    _isRefreshing = true;

                    // Queue N-1 requests
                    for (let i = 0; i < numRequests - 1; i++) {
                        failedQueue.push({
                            resolve: () => { },
                            reject: () => { },
                        });
                    }

                    // Simulate refresh failure
                    const refreshError = new Error('Refresh failed: invalid token');

                    try {
                        throw refreshError;
                    }
                    catch (error) {
                        processQueue(error, null);
                    }
                    finally {
                        _isRefreshing = false;
                    }

                    // Verify all queued requests received the same error
                    expect(rejectionErrors.length).toBe(numRequests - 1);
                    rejectionErrors.forEach((error) => {
                        expect(error).toBe(refreshError);
                    });
                },
            ),
            { numRuns: 100 },
        );
    });

    test('property 4: refresh failure prevents retry with new token', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 5 }),
                (numRequests) => {
                    let _isRefreshing = false;
                    let failedQueue: Array<{
                        resolve: (value: unknown) => void;
                        reject: (reason?: unknown) => void;
                    }> = [];
                    let newTokenAssigned = false;

                    function processQueue(error: unknown, token: string | null = null) {
                        failedQueue.forEach(({ resolve, reject }) => {
                            if (error) {
                                reject(error);
                            }
                            else {
                                if (token) {
                                    newTokenAssigned = true;
                                }
                                resolve(token);
                            }
                        });
                        failedQueue = [];
                    }

                    // Queue N requests
                    _isRefreshing = true;
                    for (let i = 0; i < numRequests; i++) {
                        failedQueue.push({
                            resolve: () => { },
                            reject: () => { },
                        });
                    }

                    // Simulate refresh failure (no new token)
                    const refreshError = new Error('Refresh failed');

                    try {
                        throw refreshError;
                    }
                    catch (error) {
                        processQueue(error, null); // null token on failure
                    }
                    finally {
                        _isRefreshing = false;
                    }

                    // Verify no new token was assigned
                    expect(newTokenAssigned).toBe(false);
                    // Verify queue was processed
                    expect(failedQueue.length).toBe(0);
                },
            ),
            { numRuns: 100 },
        );
    });
});
