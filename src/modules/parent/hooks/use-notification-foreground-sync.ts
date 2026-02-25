import { useEffect } from 'react';
import { AppState } from 'react-native';
import { fetchNotifications } from '../store/use-notification-store';

/**
 * Hook to sync notifications when app comes to foreground
 * On app foreground (AppState change to 'active'), refreshes first page of notifications
 * and gets latest unreadCount from server
 */
export function useNotificationForegroundSync() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        // Refresh first page and get latest unreadCount
        await fetchNotifications(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
