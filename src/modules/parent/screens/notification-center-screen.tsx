import type { Href } from 'expo-router';
import type { Notification } from '../services/notifications.service';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from '@/components/ui';
import { NotificationItem } from '../components/notification-item';
import { PushDisabledBanner } from '../components/push-disabled-banner';
import { useNotificationStore } from '../store/use-notification-store';

function SkeletonLoader() {
  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map(i => (
        <View key={i} style={styles.skeletonItem}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonBody} />
        </View>
      ))}
    </View>
  );
}

function NotificationHeader({ isRTL: _isRTL }: { isRTL: boolean }) {
  const { t } = useTranslation();
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{t('parent.notifications.title')}</Text>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <PushDisabledBanner />
      <NotificationHeader isRTL={false} />
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('parent.notifications.error')}</Text>
        <Button label={t('parent.common.retry')} onPress={onRetry} />
      </View>
    </SafeAreaView>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <PushDisabledBanner />
      <NotificationHeader isRTL={false} />
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('parent.notifications.empty')}</Text>
      </View>
    </SafeAreaView>
  );
}

/** Mark-all-as-read button in the header */
function MarkAllButton({
  unreadCount,
  isMarkingAll,
  onPress,
}: {
  unreadCount: number;
  isMarkingAll: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  if (unreadCount <= 0)
    return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isMarkingAll}
      accessibilityRole="button"
      accessibilityLabel={t('parent.notifications.markAllAsRead')}
      testID="mark-all-as-read-button"
    >
      {isMarkingAll
        ? <ActivityIndicator size="small" color="#3B82F6" />
        : <Text style={styles.markAllButton}>{t('parent.notifications.markAllAsRead')}</Text>}
    </TouchableOpacity>
  );
}

export function NotificationCenterScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const notifications = useNotificationStore.use.notifications();
  const unreadCount = useNotificationStore.use.unreadCount();
  const isLoading = useNotificationStore.use.isLoading();
  const error = useNotificationStore.use.error();
  const hasMore = useNotificationStore.use.hasMore();
  const fetchNotifications = useNotificationStore.use.fetchNotifications();
  const markAsRead = useNotificationStore.use.markAsRead();
  const markAllAsRead = useNotificationStore.use.markAllAsRead();

  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    void fetchNotifications(true);
  }, []);

  const handleNotificationPress = useCallback(
    async (notification: Notification) => {
      try {
        await markAsRead(notification.id);
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

  if (isLoading && notifications.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <PushDisabledBanner />
        <NotificationHeader isRTL={isRTL} />
        <SkeletonLoader />
      </SafeAreaView>
    );
  }

  if (error && notifications.length === 0) {
    return <ErrorState onRetry={handleRetry} />;
  }

  if (notifications.length === 0) {
    return <EmptyState />;
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <PushDisabledBanner />
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <Text style={styles.headerTitle}>{t('parent.notifications.title')}</Text>
        <MarkAllButton unreadCount={unreadCount} isMarkingAll={isMarkingAll} onPress={handleMarkAllAsRead} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handleNotificationPress(item)}
          />
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoading && notifications.length > 0
            ? (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" />
                </View>
              )
            : null
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  markAllButton: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skeletonItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  skeletonTitle: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
    width: '60%',
  },
  skeletonBody: {
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    width: '100%',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
