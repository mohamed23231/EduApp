import type { Notification } from '../../services/notifications.service';
import type { NotificationSection } from './notification-sections';
import { ActivityIndicator, SectionList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { NotificationItem } from '../notification-item';
import { PushDisabledBanner } from '../push-disabled-banner';
import { NotificationHeader } from './notification-header';
import { PermissionPromptSlot } from './permission-prompt-slot';

type NotificationListViewProps = {
  sections: NotificationSection[];
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
  showBack?: boolean;
};

export function NotificationListView({
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
  showBack,
}: NotificationListViewProps) {
  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.neutral.paper }}>
      <PushDisabledBanner />
      <PermissionPromptSlot />
      <NotificationHeader
        isRTL={isRTL}
        onBack={onBack}
        showBack={showBack}
        unreadCount={unreadCount}
        isMarkingAll={isMarkingAll}
        onMarkAllAsRead={onMarkAllAsRead}
      />

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <Text className="mx-4 mt-4 mb-2 text-sm font-bold tracking-wider uppercase" style={{ textAlign: isRTL ? 'right' : 'left', color: colors.neutral.inkMuted }}>
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
                  <ActivityIndicator size="small" color={colors.brand.primary} />
                </View>
              )
            : null
        }
        contentContainerStyle={{ paddingBottom: 110 }}
      />
    </SafeAreaView>
  );
}
