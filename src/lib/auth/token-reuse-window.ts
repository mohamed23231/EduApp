/**
 * Token Reuse Window Utility
 *
 * Manages the 120-second window during which a Google ID token can be reused
 * for the signup call after an AUTH_SIGNUP_REQUIRED response from login.
 *
 * Requirements: 10.4, 10.7, 10.8
 */

export interface TokenWithTimestamp {
    idToken: string;
    iat: number; // Issued-at timestamp in milliseconds
}

/**
 * Token reuse window duration in milliseconds (120 seconds)
 */
const TOKEN_REUSE_WINDOW_MS = 120 * 1000;

/**
 * Check if a token is still within the reuse window
 *
 * @param token - Token with timestamp
 * @returns true if token is within the reuse window, false otherwise
 */
export function isTokenWithinReuseWindow(token: TokenWithTimestamp): boolean {
    const now = Date.now();
    const elapsed = now - token.iat;
    return elapsed < TOKEN_REUSE_WINDOW_MS;
}

/**
 * Get remaining time in the reuse window
 *
 * @param token - Token with timestamp
 * @returns Remaining time in milliseconds, or 0 if expired
 */
export function getTokenRemainingTime(token: TokenWithTimestamp): number {
    const now = Date.now();
    const elapsed = now - token.iat;
    const remaining = TOKEN_REUSE_WINDOW_MS - elapsed;
    return Math.max(0, remaining);
}

/**
 * Create a token with timestamp
 *
 * @param idToken - Google ID token
 * @returns Token with current timestamp
 */
export function createTokenWithTimestamp(idToken: string): TokenWithTimestamp {
    return {
        idToken,
        iat: Date.now(),
    };
}
