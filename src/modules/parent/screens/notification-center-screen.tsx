import type { Href } from 'expo-router';
import type { Notification } from '../services/notifications.service';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager } from 'react-native';
import {
  buildNotificationSections,
  NotificationEmptyState,
  NotificationErrorState,
  NotificationListView,
  NotificationLoadingState,
} from '../components/notifications';
import { isSafeParentNotificationDeepLink } from '../services/notification-deep-link';
import { useNotificationStore } from '../store/use-notification-store';

/**
 * NotificationCenterScreen — composes the notification list, its loading /
 * empty / error states, and the mark-all-read bar. All presentational blocks
 * live in `../components/notifications/` to keep this file under the 300-line
 * cap. Section grouping is in `../components/notifications/notification-sections`.
 */

export function NotificationCenterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const notifications = useNotificationStore.use.notifications();
  const unreadCount = useNotificationStore.use.unreadCount();
  const isLoading = useNotificationStore.use.isLoading();
  const error = useNotificationStore.use.error();
  const hasMore = useNotificationStore.use.hasMore();
  const fetchNotifications = useNotificationStore.use.fetchNotifications();
  const markAsRead = useNotificationStore.use.markAsRead();
  const markAllAsRead = useNotificationStore.use.markAllAsRead();

  const isRTL = I18nManager.isRTL;

  useEffect(() => {
    void fetchNotifications(true);
  }, [fetchNotifications]);

  const handleNotificationPress = useCallback(
    async (notification: Notification) => {
      try {
        await markAsRead(notification.id);
        if (!isSafeParentNotificationDeepLink(notification.deepLink)) {
          console.warn(
            '[Notifications] Ignoring unsafe deep link from notification card',
            notification.deepLink,
          );
          return;
        }
        router.push(notification.deepLink as Href);
      }
      catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    },
    [markAsRead, router],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    setIsMarkingAll(true);
    try {
      await markAllAsRead();
    }
    catch (err) {
      console.error('Failed to mark all as read:', err);
    }
    finally {
      setIsMarkingAll(false);
    }
  }, [markAllAsRead]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      void fetchNotifications(false);
    }
  }, [isLoading, hasMore, fetchNotifications]);

  const handleRetry = useCallback(() => {
    void fetchNotifications(true);
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications(true);
    setRefreshing(false);
  }, [fetchNotifications]);

  const groupedNotifications = useMemo(
    () => buildNotificationSections(notifications, t),
    [notifications, t],
  );

  const handleBack = useCallback(() => router.back(), [router]);

  if (isLoading && notifications.length === 0) {
    return <NotificationLoadingState isRTL={isRTL} onBack={handleBack} />;
  }

  if (error && notifications.length === 0) {
    return <NotificationErrorState isRTL={isRTL} onBack={handleBack} onRetry={handleRetry} />;
  }

  if (notifications.length === 0) {
    return <NotificationEmptyState isRTL={isRTL} onBack={handleBack} />;
  }

  return (
    <NotificationListView
      sections={groupedNotifications}
      isRTL={isRTL}
      isLoading={isLoading}
      notifications={notifications}
      unreadCount={unreadCount}
      isMarkingAll={isMarkingAll}
      refreshing={refreshing}
      onMarkAllAsRead={handleMarkAllAsRead}
      onNotificationPress={handleNotificationPress}
      onLoadMore={handleLoadMore}
      onRefresh={onRefresh}
      onBack={handleBack}
    />
  );
}
