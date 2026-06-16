import type { TFunction } from 'i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, I18nManager, Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type Notification = {
  id: string;
  notificationType: string;
  titleKey: string;
  bodyKey: string;
  bodyParams: Record<string, string>;
  status: 'READ' | 'UNREAD';
  createdAt: string;
  readAt: string | null;
  deepLink: string;
};

type NotificationItemProps = {
  notification: Notification;
  onPress: () => void;
};

function resolveNotificationTranslationKey(key: string): string {
  const trimmedKey = key.trim();

  // Backend stores notification keys under "notification.*", while mobile
  // resources keep them under "parent.notifications.*".
  if (!trimmedKey.startsWith('notification.')) {
    return trimmedKey;
  }

  const suffix = trimmedKey.slice('notification.'.length);
  const normalizedSuffix = suffix
    .replace(/^low_score\./, 'lowScore.')
    .replace(/^low-score\./, 'lowScore.');

  return `parent.notifications.${normalizedSuffix}`;
}

function buildNotificationFallback(
  sourceKey: string,
  params: Record<string, string>,
  language: string,
): string {
  const isArabic = language.startsWith('ar');
  const studentName = params.studentName ?? (isArabic ? 'الطالب' : 'Student');
  const sessionDate = params.sessionDate ?? '';
  const rating = params.rating ?? (isArabic ? 'غير متاح' : 'N/A');
  const teacherName = params.teacherName ?? (isArabic ? 'المعلم' : 'Teacher');

  const normalizedKey = sourceKey.toLowerCase();
  const isTitle = normalizedKey.endsWith('.title');
  const isAbsence = normalizedKey.includes('absence');
  const isLowScore
    = normalizedKey.includes('lowscore')
      || normalizedKey.includes('low_score')
      || normalizedKey.includes('low-score');

  if (isTitle && isAbsence) {
    return isArabic ? 'تنبيه غياب' : 'Absence Alert';
  }

  if (isTitle && isLowScore) {
    return isArabic ? 'تنبيه أداء منخفض' : 'Low Performance Alert';
  }

  if (!isTitle && isAbsence) {
    return isArabic
      ? `تم تحديد ${studentName} كغائب في ${sessionDate}`
      : `${studentName} was marked absent on ${sessionDate}`;
  }

  if (!isTitle && isLowScore) {
    return isArabic
      ? `حصل ${studentName} على تقييم ${rating} من ${teacherName} بتاريخ ${sessionDate}`
      : `${studentName} received a rating of ${rating} from ${teacherName} on ${sessionDate}`;
  }

  return isArabic ? 'إشعار جديد' : 'New notification';
}

function formatDate(dateString: string, t: TFunction): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1)
    return t('parent.notifications.time.justNow', 'Just now');
  if (diffMins < 60)
    return t('parent.notifications.time.minutesAgo', '{{count}}m ago', { count: diffMins });
  if (diffHours < 24)
    return t('parent.notifications.time.hoursAgo', '{{count}}h ago', { count: diffHours });
  if (diffDays < 7)
    return t('parent.notifications.time.daysAgo', '{{count}}d ago', { count: diffDays });

  return date.toLocaleDateString();
}

function getNotificationIconConfig(normalizedTitleKey: string): {
  name: 'alert-circle' | 'trending-down' | 'notifications';
  color: string;
  bgClass: string;
} {
  const isAbsence = normalizedTitleKey.includes('absence');
  const isLowScore
    = normalizedTitleKey.includes('lowscore')
      || normalizedTitleKey.includes('low_score')
      || normalizedTitleKey.includes('low-score');

  if (isAbsence)
    return { name: 'alert-circle', color: '#FF5B4A', bgClass: 'bg-[#FFE1DD]' };
  if (isLowScore)
    return { name: 'trending-down', color: '#FFB020', bgClass: 'bg-[#FFF0D5]' };
  return { name: 'notifications', color: '#22C572', bgClass: 'bg-[#EDFBF3]' };
}

function useNotificationContent(notification: Notification): { title: string; body: string } {
  const { t, i18n } = useTranslation();

  const resolvedTitleKey = resolveNotificationTranslationKey(notification.titleKey);
  const resolvedBodyKey = resolveNotificationTranslationKey(notification.bodyKey);

  const translatedTitle = t(resolvedTitleKey);
  const title
    = translatedTitle === resolvedTitleKey
      ? buildNotificationFallback(notification.titleKey, notification.bodyParams, i18n.language)
      : translatedTitle;

  const translatedBody = t(resolvedBodyKey, { ...notification.bodyParams });
  const body
    = translatedBody === resolvedBodyKey
      ? buildNotificationFallback(notification.bodyKey, notification.bodyParams, i18n.language)
      : translatedBody;

  return { title, body };
}

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const isUnread = notification.status === 'UNREAD';
  const { title, body } = useNotificationContent(notification);

  const readStateLabel = t(
    isUnread ? 'parent.notifications.a11yUnread' : 'parent.notifications.a11yRead',
    isUnread ? 'unread' : 'read',
  );
  const accessibilityLabel = `${body}, ${readStateLabel}`;
  const isRTL = I18nManager.isRTL;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.8, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const normalizedTitleKey = notification.titleKey.toLowerCase();

  const iconConfig = getNotificationIconConfig(normalizedTitleKey);

  const containerClasses = [
    'rounded-2xl p-4 mb-3 min-h-[44px] w-full',
    isUnread ? 'shadow-sm' : 'border border-transparent',
    isRTL ? 'flex-row-reverse' : 'flex-row',
    'items-start',
  ].filter(Boolean).join(' ');

  const rowClasses = [
    'items-center justify-between mb-1',
    isRTL ? 'flex-row-reverse' : 'flex-row',
  ].filter(Boolean).join(' ');

  const alignment = isRTL ? 'right' : 'left';

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        testID={`notification-item-${notification.id}`}
        className={containerClasses}
        style={isUnread
          ? { backgroundColor: colors.neutral.card, borderWidth: 1, borderColor: colors.neutral.rule }
          : { backgroundColor: colors.neutral.paper }}
      >
        <View className={`size-12 items-center justify-center rounded-full ${iconConfig.bgClass} ${isRTL ? 'ms-3' : 'me-3'}`}>
          <Ionicons name={iconConfig.name} size={24} color={iconConfig.color} />
        </View>

        <View className="flex-1">
          <View className={rowClasses}>
            <Text
              className={`flex-1 text-sm ${isUnread ? 'font-bold' : 'font-semibold'}`}
              numberOfLines={1}
              style={{ textAlign: alignment, color: isUnread ? colors.neutral.ink : colors.neutral.inkMuted }}
            >
              {title}
            </Text>
            {isUnread && (
              <View className="mx-2 size-2 rounded-full" style={{ backgroundColor: colors.brand.primary }} />
            )}
          </View>

          <Text
            className={`text-sm ${isUnread ? 'font-medium' : 'font-normal'}`}
            numberOfLines={2}
            style={{ textAlign: alignment, lineHeight: 20, color: isUnread ? colors.neutral.ink : colors.neutral.inkMuted }}
          >
            {body}
          </Text>

          <Text
            className="mt-2 text-xs font-medium"
            style={{ textAlign: alignment, color: isUnread ? colors.brand.primary : colors.neutral.dim }}
          >
            {formatDate(notification.createdAt, t)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
