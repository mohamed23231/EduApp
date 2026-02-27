import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui';
import { Color } from '@/components/ui/color-utils';

type NotificationBellProps = {
  unreadCount: number;
  onPress: () => void;
};

export function NotificationBell({ unreadCount, onPress }: NotificationBellProps) {
  const accessibilityLabel = unreadCount > 0
    ? `Notifications, ${unreadCount} unread`
    : 'Notifications';

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID="notification-bell"
    >
      <Ionicons name="notifications" size={24} color={Color.blue(500)} />
      {unreadCount > 0 && (
        <View style={styles.badge} testID="notification-badge">
          <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 10,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Color.danger(500),
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Color.white(),
    fontSize: 12,
    fontWeight: '600',
  },
});
