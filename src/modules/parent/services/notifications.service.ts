import type { ApiSuccess } from '@/shared/types/api';
import { client } from '@/lib/api/client';
import { unwrapData } from '@/shared/services/api-utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export type Notification = {
    id: string;
    notificationType: string;
    titleKey: string;
    bodyKey: string;
    bodyParams: Record<string, string>;
    status: 'UNREAD' | 'READ';
    createdAt: string;
    readAt: string | null;
    deepLink: string;
};

export type PaginatedNotificationsResponse = {
    notifications: Notification[];
    meta: {
        nextCursor: string | null;
        hasMore: boolean;
        unreadCount: number;
    };
};

export type NotificationResponse = {
    id: string;
    status: 'READ' | 'UNREAD';
    readAt: string | null;
};

export type SuccessResponse = {
    updatedCount: number;
};

export type DeviceTokenResponse = {
    id: string;
    token: string;
    createdAt: string;
};

export type RegisterDeviceRequest = {
    token: string;
};

// ─── API Service ─────────────────────────────────────────────────────────────

export const notificationsService = {
    /**
     * Fetch paginated list of notifications for authenticated parent
     * @param cursor - Optional cursor for pagination (UUID of last notification)
     * @param limit - Optional limit (default 20, max 50)
     */
    list: async (cursor?: string, limit?: number): Promise<PaginatedNotificationsResponse> => {
        const response = await client.get<ApiSuccess<PaginatedNotificationsResponse> | PaginatedNotificationsResponse>(
            '/parents/notifications',
            {
                params: {
                    ...(cursor && { cursor }),
                    ...(limit && { limit }),
                },
            },
        );
        return unwrapData(response.data);
    },

    /**
     * Mark a single notification as read
     * @param id - Notification ID
     */
    markAsRead: async (id: string): Promise<NotificationResponse> => {
        const response = await client.patch<ApiSuccess<NotificationResponse> | NotificationResponse>(
            `/parents/notifications/${id}/read`,
        );
        return unwrapData(response.data);
    },

    /**
     * Mark all unread notifications as read for authenticated parent
     */
    markAllAsRead: async (): Promise<SuccessResponse> => {
        const response = await client.patch<ApiSuccess<SuccessResponse> | SuccessResponse>(
            '/parents/notifications/read-all',
        );
        return unwrapData(response.data);
    },

    /**
     * Register a device token for push notifications
     */
    registerDevice: async (token: string): Promise<DeviceTokenResponse> => {
        const response = await client.post<
            ApiSuccess<DeviceTokenResponse> | DeviceTokenResponse
        >('/parents/devices', { token } satisfies RegisterDeviceRequest);
        return unwrapData(response.data);
    },

    /**
     * Unregister a device token by token ID
     */
    unregisterDevice: async (tokenId: string): Promise<void> => {
        await client.delete(`/parents/devices/${tokenId}`);
    },
};
