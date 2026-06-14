import type { Href } from 'expo-router';
import type { TFunction } from 'i18next';
import type { Notification } from '../services/notifications.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
  I18nManager,
  Pressable,
  SectionList,
  TouchableOpacity,
  View,
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

  if (diffDays === 0)
    return t('parent.notifications.today', 'Today');
  if (diffDays === 1)
    return t('parent.notifications.yesterday', 'Yesterday');
  if (diffDays <= 7)
    return t('parent.notifications.thisWeek', 'This Week');
  return t('parent.notifications.earlier', 'Earlier');
}

function buildNotificationSections(
  notifications: Notification[],
  t: TFunction,
): { title: string; data: Notification[] }[] {
  if (!notifications)
    return [];

  const groups = new Map<string, Notification[]>();
  notifications.forEach((n) => {
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
  categories.forEach((cat) => {
    if (groups.has(cat)) {
      result.push({ title: cat, data: groups.get(cat)! });
    }
  });

  return result;
}

function SkeletonLoader() {
  const anim = useRef(new Animated.Value(0)).current;
  const isRTL = I18nManager.isRTL;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.8] });

  return (
    <View className="flex-1 p-4" style={{ backgroundColor: '#F5F5F0' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Animated.View key={i} style={{ opacity, backgroundColor: '#FFFFFF', borderColor: '#E6E3DB' }} className={`mb-3 flex-row items-start rounded-2xl border p-4 shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
          <View className={`size-12 rounded-full ${isRTL ? 'ms-3' : 'me-3'}`} style={{ backgroundColor: '#E6E3DB' }} />
          <View className="flex-1">
            <View className={`mb-2 h-4 w-2/3 rounded-sm ${isRTL ? 'ms-auto' : ''}`} style={{ backgroundColor: '#E6E3DB' }} />
            <View className={`mb-1.5 h-3 w-full rounded-sm ${isRTL ? 'ms-auto' : ''}`} style={{ backgroundColor: '#E6E3DB' }} />
            <View className={`h-3 w-4/5 rounded-sm ${isRTL ? 'ms-auto' : ''}`} style={{ backgroundColor: '#E6E3DB' }} />
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
    <View className={`flex-row items-center px-5 py-4 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ borderBottomWidth: 1, borderBottomColor: '#E6E3DB', backgroundColor: '#FFFFFF' }}>
      <Pressable
        onPress={() => router.back()}
        className={`p-2 ${isRTL ? 'ms-2' : 'me-2'}`}
        accessibilityRole="button"
        accessibilityLabel={t('parent.common.back', 'Back')}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color="#0B0D10" />
      </Pressable>
      <Text className="flex-1 text-xl font-bold" style={{ textAlign: isRTL ? 'right' : 'left', color: '#0B0D10' }}>
        {t('parent.notifications.title', 'Notifications')}
      </Text>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: '#F5F5F0' }}>
      <PushDisabledBanner />
      <NotificationHeader isRTL={isRTL} />
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-4 size-16 items-center justify-center rounded-full" style={{ backgroundColor: '#FFE1DD' }}>
          <Ionicons name="alert" size={32} color="#FF5B4A" />
        </View>
        <Text className="mb-2 text-center text-lg font-bold" style={{ color: '#0B0D10' }}>
          {t('parent.notifications.errorTitle', 'Oops! Something went wrong')}
        </Text>
        <Text className="mb-6 text-center text-sm" style={{ color: '#5C636E' }}>
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
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: '#F5F5F0' }}>
      <PushDisabledBanner />
      <NotificationHeader isRTL={isRTL} />
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-6 size-20 items-center justify-center rounded-full" style={{ backgroundColor: '#E6E3DB' }}>
          <Ionicons name="notifications-off-outline" size={40} color="#5C636E" />
        </View>
        <Text className="mb-2 text-center text-xl font-bold" style={{ color: '#0B0D10' }}>
          {t('parent.notifications.emptyTitle', 'All caught up!')}
        </Text>
        <Text className="text-center text-base" style={{ color: '#5C636E' }}>
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
        ? <ActivityIndicator size="small" color="#22C572" />
        : <Text className="text-sm font-semibold" style={{ color: '#22C572' }}>{t('parent.notifications.markAllAsRead')}</Text>}
    </TouchableOpacity>
  );
}

type NotificationListViewProps = {
  sections: { title: string; data: Notification[] }[];
  isRTL: boolean;
  isLoading: boolean;
  notifications: Notification[];
  unreadCount: number;
  isMarkingAll: boolean;
  refreshing: boolean;
  onMarkAllAsRead: () => void;
  onNotificationPress: (notification: Notification) => void;
  onLoadMore: () => void;
  onRefresh: () => void;
  onBack: () => void;
};

function NotificationListView({
  sections,
  isRTL,
  isLoading,
  notifications,
  unreadCount,
  isMarkingAll,
  refreshing,
  onMarkAllAsRead,
  onNotificationPress,
  onLoadMore,
  onRefresh,
  onBack,
}: NotificationListViewProps) {
  const { t } = useTranslation();
  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: '#F5F5F0' }}>
      <PushDisabledBanner />
      <View className={`flex-row items-center px-5 py-4 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ borderBottomWidth: 1, borderBottomColor: '#E6E3DB', backgroundColor: '#FFFFFF' }}>
        <Pressable
          onPress={onBack}
          className={`p-2 ${isRTL ? 'ms-2' : 'me-2'}`}
          accessibilityRole="button"
          accessibilityLabel={t('parent.common.back', 'Back')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color="#0B0D10" />
        </Pressable>
        <Text className="flex-1 text-xl font-bold" style={{ textAlign: isRTL ? 'right' : 'left', color: '#0B0D10' }}>
          {t('parent.notifications.title')}
        </Text>
        <MarkAllButton unreadCount={unreadCount} isMarkingAll={isMarkingAll} onPress={onMarkAllAsRead} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="mx-4 mt-4 mb-2 text-sm font-bold tracking-wider uppercase" style={{ textAlign: isRTL ? 'right' : 'left', color: '#5C636E' }}>
            {title}
          </Text>
        )}
        renderItem={({ item }) => (
          <View className="px-4">
            <NotificationItem
              notification={item}
              onPress={() => onNotificationPress(item)}
            />
          </View>
        )}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={
          isLoading && notifications.length > 0
            ? (
                <View className="items-center py-4">
                  <ActivityIndicator size="small" color="#22C572" />
                </View>
              )
            : null
        }
        contentContainerStyle={{ paddingBottom: 110 }}
      />
    </SafeAreaView>
  );
}

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

  if (isLoading && notifications.length === 0) {
    return (
      <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: '#F5F5F0' }}>
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
      onBack={() => router.back()}
    />
  );
}
