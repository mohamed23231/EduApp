import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

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
        ? <ActivityIndicator size="small" color={colors.brand.primary} />
        : <Text className="text-sm font-semibold" style={{ color: colors.brand.primary }}>{t('parent.notifications.markAllAsRead')}</Text>}
    </TouchableOpacity>
  );
}

type NotificationHeaderProps = {
  isRTL: boolean;
  onBack: () => void;
  unreadCount?: number;
  isMarkingAll?: boolean;
  onMarkAllAsRead?: () => void;
};

export function NotificationHeader({
  isRTL,
  onBack,
  unreadCount,
  isMarkingAll,
  onMarkAllAsRead,
}: NotificationHeaderProps) {
  const { t } = useTranslation();
  return (
    <View
      className={`flex-row items-center px-5 py-4 ${isRTL ? 'flex-row-reverse' : ''}`}
      style={{ borderBottomWidth: 1, borderBottomColor: colors.neutral.rule, backgroundColor: colors.neutral.card }}
    >
      <Pressable
        onPress={onBack}
        className={`p-2 ${isRTL ? 'ms-2' : 'me-2'}`}
        accessibilityRole="button"
        accessibilityLabel={t('parent.common.back', 'Back')}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.neutral.ink} />
      </Pressable>
      <Text className="flex-1 text-xl font-bold" style={{ textAlign: isRTL ? 'right' : 'left', color: colors.neutral.ink }}>
        {t('parent.notifications.title', 'Notifications')}
      </Text>
      {onMarkAllAsRead
        ? (
            <MarkAllButton
              unreadCount={unreadCount ?? 0}
              isMarkingAll={isMarkingAll ?? false}
              onPress={onMarkAllAsRead}
            />
          )
        : null}
    </View>
  );
}
