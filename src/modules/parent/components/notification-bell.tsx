import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui';

type NotificationBellProps = {
  unreadCount: number;
  onPress: () => void;
};

export function NotificationBell({ unreadCount, onPress }: NotificationBellProps) {
  const { t } = useTranslation();
  const accessibilityLabel = unreadCount > 0
    ? t('parent.notifications.bellLabelUnread', '{{count}} unread notifications', { count: unreadCount })
    : t('parent.notifications.bellLabel', 'Notifications');

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID="notification-bell"
    >
      <Ionicons name="notifications" size={24} color="#0B0D10" />
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
    end: 0,
    backgroundColor: '#FF5B4A',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
