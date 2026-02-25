import type { Notification } from '../services/notifications.service';
import { create } from 'zustand';
import { getItem, setItem } from '@/lib/storage';
import { createSelectors } from '@/lib/utils';
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

/** Persist notification metadata to MMKV */
async function persistNotificationMeta(unreadCount: number) {
  await setItem(UNREAD_COUNT_KEY, unreadCount);
  await setItem(LAST_SYNCED_AT_KEY, Date.now());
}

/** Mark a single notification as read in state */
function markNotificationRead(notifications: Notification[], id: string) {
  return notifications.map(n =>
    n.id === id
      ? { ...n, status: 'READ' as const, readAt: n.readAt ?? new Date().toISOString() }
      : n,
  );
}

/** Mark all unread notifications as read in state */
function markAllNotificationsRead(notifications: Notification[]) {
  const now = new Date().toISOString();
  return notifications.map(n =>
    n.status === 'UNREAD' ? { ...n, status: 'READ' as const, readAt: now } : n,
  );
}

/** Extract error message from unknown error */
function getErrorMsg(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

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

      set(prevState => ({
        notifications: reset ? response.notifications : [...prevState.notifications, ...response.notifications],
        cursor: response.meta.nextCursor,
        hasMore: response.meta.hasMore,
        unreadCount: response.meta.unreadCount,
        lastSyncedAt: Date.now(),
        isLoading: false,
      }));

      await persistNotificationMeta(response.meta.unreadCount);
    }
    catch (err) {
      set({ error: getErrorMsg(err, 'Failed to fetch notifications'), isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      let newCount = get().unreadCount;
      set((state) => {
        const wasUnread = state.notifications.find(n => n.id === id)?.status === 'UNREAD';
        newCount = wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount;
        return { notifications: markNotificationRead(state.notifications, id), unreadCount: newCount };
      });
      await setItem(UNREAD_COUNT_KEY, newCount);
    }
    catch (err) {
      set({ error: getErrorMsg(err, 'Failed to mark notification as read') });
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsService.markAllAsRead();
      set(state => ({ notifications: markAllNotificationsRead(state.notifications), unreadCount: 0 }));
      await setItem(UNREAD_COUNT_KEY, 0);
    }
    catch (err) {
      set({ error: getErrorMsg(err, 'Failed to mark all notifications as read') });
    }
  },

  setUnreadCount: (count: number) => {
    set({ unreadCount: count });
    setItem(UNREAD_COUNT_KEY, count);
  },

  hydrate: () => {
    try {
      set({ unreadCount: getItem<number>(UNREAD_COUNT_KEY) ?? 0, lastSyncedAt: getItem<number>(LAST_SYNCED_AT_KEY) ?? null });
    }
    catch (err) {
      console.error('[NotificationStore] Hydration failed:', err);
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
