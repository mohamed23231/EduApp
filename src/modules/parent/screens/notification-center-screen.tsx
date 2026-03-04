import type { TFunction } from 'i18next';
import type { Href } from 'expo-router';
import type { Notification } from '../services/notifications.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  SectionList,
  Pressable,
  TouchableOpacity,
  View,
  Animated,
  I18nManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from '@/components/ui';
import { NotificationItem } from '../components/notification-item';
import { PushDisabledBanner } from '../components/push-disabled-banner';
import { isSafeParentNotificationDeepLink } from '../services/notification-deep-link';
import { useNotificationStore } from '../store/use-notification-store';

function getCategory(dateString: string, t: TFunction): string {
  const date = new Date(dateString);
  const now = new Date();
  
  // Set to midnight for accurate day comparison
  const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = Math.abs(dNow.getTime() - dDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (diffDays === 0) return t('parent.notifications.today', 'Today');
  if (diffDays === 1) return t('parent.notifications.yesterday', 'Yesterday');
  if (diffDays <= 7) return t('parent.notifications.thisWeek', 'This Week');
  return t('parent.notifications.earlier', 'Earlier');
}

function SkeletonLoader() {
  const anim = useRef(new Animated.Value(0)).current;
  const isRTL = I18nManager.isRTL;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] });

  return (
    <View className="flex-1 px-4 py-4 bg-[#F9FAFB]">
      {[1, 2, 3, 4, 5].map(i => (
        <Animated.View key={i} style={{ opacity }} className={`bg-white rounded-2xl p-4 mb-3 border border-gray-100 flex-row items-start shadow-sm ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          <View className={`w-12 h-12 rounded-full bg-gray-200 ${isRTL ? 'ml-3' : 'mr-3'}`} />
          <View className="flex-1">
            <View className={`w-2/3 h-4 bg-gray-200 rounded mb-2 ${isRTL ? 'ml-auto' : ''}`} />
            <View className={`w-full h-3 bg-gray-200 rounded mb-1.5 ${isRTL ? 'ml-auto' : ''}`} />
            <View className={`w-4/5 h-3 bg-gray-200 rounded ${isRTL ? 'ml-auto' : ''}`} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

function NotificationHeader({ isRTL }: { isRTL: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <View className={`flex-row items-center px-5 py-4 bg-white border-b border-gray-200 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
      <Pressable
        onPress={() => router.back()}
        className={`p-2 ${isRTL ? 'ml-2' : 'mr-2'}`}
        accessibilityRole="button"
        accessibilityLabel={t('parent.common.back', 'Back')}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#111827" />
      </Pressable>
      <Text className="flex-1 text-xl font-bold text-gray-900" style={{ textAlign: isRTL ? 'right' : 'left' }}>
        {t('parent.notifications.title', 'Notifications')}
      </Text>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#F9FAFB]">
      <PushDisabledBanner />
      <NotificationHeader isRTL={isRTL} />
      <View className="flex-1 justify-center items-center px-6">
        <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
          <Ionicons name="alert" size={32} color="#EF4444" />
        </View>
        <Text className="text-lg font-bold text-gray-900 mb-2 text-center">
          {t('parent.notifications.errorTitle', 'Oops! Something went wrong')}
        </Text>
        <Text className="text-sm text-gray-500 text-center mb-6">
          {t('parent.notifications.error', 'We could not load your notifications. Please try again.')}
        </Text>
        <Button label={t('parent.common.retry', 'Retry')} onPress={onRetry} />
      </View>
    </SafeAreaView>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#F9FAFB]">
      <PushDisabledBanner />
      <NotificationHeader isRTL={isRTL} />
      <View className="flex-1 justify-center items-center px-6">
        <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-6">
          <Ionicons name="notifications-off-outline" size={40} color="#9CA3AF" />
        </View>
        <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
          {t('parent.notifications.emptyTitle', 'All caught up!')}
        </Text>
        <Text className="text-base text-gray-500 text-center">
          {t('parent.notifications.empty', 'You have no new notifications at the moment.')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

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
  if (unreadCount <= 0) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isMarkingAll}
      accessibilityRole="button"
      accessibilityLabel={t('parent.notifications.markAllAsRead')}
      testID="mark-all-as-read-button"
    >
      {isMarkingAll
        ? <ActivityIndicator size="small" color="#6366F1" />
        : <Text className="text-sm font-semibold text-indigo-500">{t('parent.notifications.markAllAsRead')}</Text>}
    </TouchableOpacity>
  );
}

export function NotificationCenterScreen() {
  const { t, i18n } = useTranslation();
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

  const groupedNotifications = useMemo(() => {
    if (!notifications) return [];
    
    const groups = new Map<string, Notification[]>();
    notifications.forEach(n => {
      const category = getCategory(n.createdAt, t);
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(n);
    });

    const categories = [
      t('parent.notifications.today', 'Today'),
      t('parent.notifications.yesterday', 'Yesterday'),
      t('parent.notifications.thisWeek', 'This Week'),
      t('parent.notifications.earlier', 'Earlier'),
    ];

    const result: { title: string; data: Notification[] }[] = [];
    categories.forEach(cat => {
      if (groups.has(cat)) {
        result.push({ title: cat, data: groups.get(cat)! });
      }
    });

    return result;
  }, [notifications, t]);

  if (isLoading && notifications.length === 0) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-[#F9FAFB]">
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
    <SafeAreaView edges={['top']} className="flex-1 bg-[#F9FAFB]">
      <PushDisabledBanner />
      <View className={`flex-row items-center px-5 py-4 bg-white border-b border-gray-200 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
        <Pressable
          onPress={() => router.back()}
          className={`p-2 ${isRTL ? 'ml-2' : 'mr-2'}`}
          accessibilityRole="button"
          accessibilityLabel={t('parent.common.back', 'Back')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#111827" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-gray-900" style={{ textAlign: isRTL ? 'right' : 'left' }}>
          {t('parent.notifications.title')}
        </Text>
        <MarkAllButton unreadCount={unreadCount} isMarkingAll={isMarkingAll} onPress={handleMarkAllAsRead} />
      </View>

      <SectionList
        sections={groupedNotifications}
        keyExtractor={item => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-4 mb-2 mx-4" style={{ textAlign: isRTL ? 'right' : 'left' }}>
            {title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View className="px-4">
            <NotificationItem
              notification={item}
              onPress={() => handleNotificationPress(item)}
            />
          </View>
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={
          isLoading && notifications.length > 0
            ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#6366F1" />
                </View>
              )
            : null
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}
