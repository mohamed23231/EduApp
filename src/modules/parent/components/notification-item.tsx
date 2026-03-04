import { useTranslation } from 'react-i18next';
import { I18nManager, Animated, Pressable, View } from 'react-native';
import { useRef } from 'react';
import { Text } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1)
    return 'Just now';
  if (diffMins < 60)
    return `${diffMins}m ago`;
  if (diffHours < 24)
    return `${diffHours}h ago`;
  if (diffDays < 7)
    return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const { t, i18n } = useTranslation();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const isUnread = notification.status === 'UNREAD';

  // Resolve title and body from localization keys
  const resolvedTitleKey = resolveNotificationTranslationKey(notification.titleKey);
  const resolvedBodyKey = resolveNotificationTranslationKey(notification.bodyKey);

  const translatedTitle = t(resolvedTitleKey);
  const title
    = translatedTitle === resolvedTitleKey
      ? buildNotificationFallback(notification.titleKey, notification.bodyParams, i18n.language)
      : translatedTitle;

  const translatedBody = t(resolvedBodyKey, {
    ...notification.bodyParams,
  });
  const body
    = translatedBody === resolvedBodyKey
      ? buildNotificationFallback(notification.bodyKey, notification.bodyParams, i18n.language)
      : translatedBody;

  const accessibilityLabel = `${body}, ${isUnread ? 'unread' : 'read'}`;
  const isRTL = I18nManager.isRTL;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.8, duration: 150, useNativeDriver: true })
    ]).start();
  };
  
  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true })
    ]).start();
  };

  const normalizedTitleKey = notification.titleKey.toLowerCase();
  const isAbsence = normalizedTitleKey.includes('absence');
  const isLowScore = 
    normalizedTitleKey.includes('lowscore') || 
    normalizedTitleKey.includes('low_score') || 
    normalizedTitleKey.includes('low-score');

  const getIconConfig = () => {
    if (isAbsence) return { name: 'alert-circle' as const, color: '#EF4444', bgClass: 'bg-red-50' };
    if (isLowScore) return { name: 'trending-down' as const, color: '#F59E0B', bgClass: 'bg-orange-50' };
    return { name: 'notifications' as const, color: '#6366F1', bgClass: 'bg-indigo-50' };
  };

  const iconConfig = getIconConfig();

  const containerClasses = [
    'rounded-2xl p-4 mb-3 min-h-[44px] w-full',
    isUnread ? 'bg-white shadow-sm border border-gray-100' : 'bg-[#F9FAFB] border border-transparent',
    isRTL ? 'flex-row-reverse' : 'flex-row',
    'items-start'
  ].filter(Boolean).join(' ');

  const rowClasses = [
    'items-center justify-between mb-1',
    isRTL ? 'flex-row-reverse' : 'flex-row'
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
      >
        <View className={`w-12 h-12 rounded-full items-center justify-center ${iconConfig.bgClass} ${isRTL ? 'ml-3' : 'mr-3'}`}>
          <Ionicons name={iconConfig.name} size={24} color={iconConfig.color} />
        </View>

        <View className="flex-1">
          <View className={rowClasses}>
            <Text 
              className={`flex-1 text-sm ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}
              numberOfLines={1}
              style={{ textAlign: alignment }}
            >
              {title}
            </Text>
            {isUnread && (
              <View className="w-2 h-2 rounded-full bg-indigo-500 mx-2" />
            )}
          </View>
          
          <Text 
            className={`text-sm ${isUnread ? 'font-medium text-gray-800' : 'font-normal text-gray-500'}`}
            numberOfLines={2}
            style={{ textAlign: alignment, lineHeight: 20 }}
          >
            {body}
          </Text>
          
          <Text 
            className={`mt-2 text-xs font-medium ${isUnread ? 'text-indigo-500' : 'text-gray-400'}`}
            style={{ textAlign: alignment }}
          >
            {formatDate(notification.createdAt)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
