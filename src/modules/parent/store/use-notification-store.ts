import { create } from 'zustand';
import { createSelectors } from '@/lib/utils';
import { getItem, setItem } from '@/lib/storage';
import type { Notification } from '../services/notifications.service';
import { notificationsService } from '../services/notifications.service';

// ─── MMKV Keys ───────────────────────────────────────────────────────────────

const UNREAD_COUNT_KEY = 'notification_unread_count';
const LAST_SYNCED_AT_KEY = 'notification_last_synced_at';

// ─── Store Types ─────────────────────────────────────────────────────────────

export type NotificationState = {
    // State
    notifications: Notification[];
    unreadCount: number;
    cursor: string | null;
    hasMore: boolean;
    isLoading: boolean;
    error: string | null;
    lastSyncedAt: number | null;

    // Actions
    fetchNotifications: (reset?: boolean) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    setUnreadCount: (count: number) => void;
    hydrate: () => void;
};

// ─── Store Implementation ─────────────────────────────────────────────────────

const _useNotificationStore = create<NotificationState>((set, get) => ({
    // Initial state
    notifications: [],
    unreadCount: 0,
    cursor: null,
    hasMore: true,
    isLoading: false,
    error: null,
    lastSyncedAt: null,

    /**
     * Fetch notifications from API with cursor-based pagination
     * @param reset - If true, reset pagination and fetch first page
     */
    fetchNotifications: async (reset = false) => {
        try {
            set({ isLoading: true, error: null });

            const state = get();
            const cursor = reset ? undefined : state.cursor ?? undefined;

            const response = await notificationsService.list(cursor, 20);

            set((prevState) => ({
                notifications: reset ? response.notifications : [...prevState.notifications, ...response.notifications],
                cursor: response.meta.nextCursor,
                hasMore: response.meta.hasMore,
                unreadCount: response.meta.unreadCount,
                lastSyncedAt: Date.now(),
                isLoading: false,
            }));

            // Persist unreadCount and lastSyncedAt to MMKV
            await setItem(UNREAD_COUNT_KEY, response.meta.unreadCount);
            await setItem(LAST_SYNCED_AT_KEY, Date.now());
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
            set({ error: errorMessage, isLoading: false });
        }
    },

    /**
     * Mark a single notification as read
     */
    markAsRead: async (id: string) => {
        try {
            await notificationsService.markAsRead(id);

            let newCount = get().unreadCount;
            set((state) => {
                const target = state.notifications.find(n => n.id === id);
                const wasUnread = target?.status === 'UNREAD';
                newCount = wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount;

                return {
                    notifications: state.notifications.map((n) =>
                        n.id === id
                            ? { ...n, status: 'READ' as const, readAt: n.readAt ?? new Date().toISOString() }
                            : n,
                    ),
                    unreadCount: newCount,
                };
            });

            await setItem(UNREAD_COUNT_KEY, newCount);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to mark notification as read';
            set({ error: errorMessage });
        }
    },

    /**
     * Mark all unread notifications as read
     */
    markAllAsRead: async () => {
        try {
            await notificationsService.markAllAsRead();

            // Update all notifications to READ status
            const now = new Date().toISOString();
            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.status === 'UNREAD' ? { ...n, status: 'READ' as const, readAt: now } : n,
                ),
                unreadCount: 0,
            }));

            // Persist unreadCount to MMKV
            await setItem(UNREAD_COUNT_KEY, 0);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
            set({ error: errorMessage });
        }
    },

    /**
     * Set unread count (used for manual updates)
     */
    setUnreadCount: (count: number) => {
        set({ unreadCount: count });
        setItem(UNREAD_COUNT_KEY, count);
    },

    /**
     * Hydrate store from MMKV on app startup
     * Restores unreadCount and lastSyncedAt for instant badge rendering
     */
    hydrate: () => {
        try {
            const unreadCount = getItem<number>(UNREAD_COUNT_KEY) ?? 0;
            const lastSyncedAt = getItem<number>(LAST_SYNCED_AT_KEY) ?? null;

            set({
                unreadCount,
                lastSyncedAt,
            });
        }
        catch (err) {
            console.error('[NotificationStore] Hydration failed:', err);
            // Continue with defaults on hydration failure
        }
    },
}));

export const useNotificationStore = createSelectors(_useNotificationStore);

// ─── Exported Actions ─────────────────────────────────────────────────────────

export function fetchNotifications(reset?: boolean) {
    return _useNotificationStore.getState().fetchNotifications(reset);
}

export function markAsRead(id: string) {
    return _useNotificationStore.getState().markAsRead(id);
}

export function markAllAsRead() {
    return _useNotificationStore.getState().markAllAsRead();
}

export function setUnreadCount(count: number) {
    return _useNotificationStore.getState().setUnreadCount(count);
}

export function hydrateNotifications() {
    return _useNotificationStore.getState().hydrate();
}
