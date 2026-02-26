/**
 * Token management API service
 */

import type { ApiSuccess } from '@/shared/types/api';
import { authClient } from '@/lib/api/client';
import type { UserRole } from '@/core/auth/roles';

type RefreshTokenPayload = {
    accessToken: string;
    refreshToken: string;
};

type ValidateTokenUser = {
    id: string;
    email: string;
    role: UserRole;
    fullName?: string;
};

type ValidateTokenPayload = {
    user: ValidateTokenUser;
};

type ValidateTokenDirectPayload = {
    userId: string;
    email: string;
    role: UserRole;
    status?: string;
    profile?: unknown;
};

export type RefreshTokenResponse = {
    accessToken: string;
    refreshToken: string;
};

export type ValidateTokenResponse = ValidateTokenUser;

export async function refreshToken(currentRefreshToken: string): Promise<RefreshTokenResponse> {
    const response = await authClient.post<ApiSuccess<RefreshTokenPayload>>(
        '/auth/refresh',
        { refreshToken: currentRefreshToken },
    );
    return response.data.data;
}

export async function validateToken(): Promise<ValidateTokenResponse> {
    const response = await authClient.post<
        ApiSuccess<ValidateTokenPayload | ValidateTokenDirectPayload> | ValidateTokenPayload | ValidateTokenDirectPayload
    >(
        '/auth/validate-token',
    );
    const raw = response.data as Record<string, unknown>;
    const payload = ('success' in raw && 'data' in raw)
        ? (raw.data as Record<string, unknown>)
        : raw;

    // Shape A: { user: { id, email, role } }
    if (payload.user && typeof payload.user === 'object') {
        return payload.user as ValidateTokenUser;
    }

    // Shape B: { userId, email, role, ... } -> normalize to AuthUser shape
    if (
        typeof payload.userId === 'string'
        && typeof payload.email === 'string'
        && typeof payload.role === 'string'
    ) {
        return {
            id: payload.userId,
            email: payload.email,
            role: payload.role as UserRole,
        };
    }

    throw new Error('Invalid validate-token response shape');
}
