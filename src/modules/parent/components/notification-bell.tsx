import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';

type NotificationBellProps = {
  unreadCount: number;
  onPress: () => void;
};

export function NotificationBell({ unreadCount, onPress }: NotificationBellProps) {
  const accessibilityLabel = unreadCount > 0
    ? `Notifications, ${unreadCount} unread`
    : 'Notifications';

  return (
    <Pressable
      className="relative p-2.5"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID="notification-bell"
    >
      <Ionicons name="notifications" size={24} color="#3478F6" />
      {unreadCount > 0 && (
        <View
          className="absolute end-0 top-0 h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500"
          testID="notification-badge"
        >
          <Text className="text-xs font-semibold text-white">{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}
