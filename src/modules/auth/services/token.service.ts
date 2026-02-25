/**
 * Token management API service
 */

import type { ApiSuccess } from '@/shared/types/api';
import { authClient } from '@/lib/api/client';

type RefreshTokenPayload = {
    accessToken: string;
    refreshToken: string;
};

type ValidateTokenUser = {
    id: string;
    email: string;
    role: string;
    fullName?: string;
};

type ValidateTokenPayload = {
    user: ValidateTokenUser;
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
    const response = await authClient.post<ApiSuccess<ValidateTokenPayload> | ValidateTokenPayload>(
        '/auth/validate-token',
    );
    const data = response.data;

    // Handle both envelope and raw formats
    if ('success' in (data as Record<string, unknown>) && 'data' in (data as Record<string, unknown>)) {
        return (data as ApiSuccess<ValidateTokenPayload>).data.user;
    }
    return (data as ValidateTokenPayload).user;
}
