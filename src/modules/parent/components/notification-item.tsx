import { useTranslation } from 'react-i18next';
import { I18nManager, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui';

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

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isUnread && styles.containerUnread,
        isRTL && styles.containerRTL,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={`notification-item-${notification.id}`}
    >
      <View style={styles.content}>
        <Text
          style={[styles.title, isUnread && styles.titleUnread]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={[styles.body, isUnread && styles.bodyUnread]}
          numberOfLines={2}
        >
          {body}
        </Text>
        <Text style={styles.timestamp}>{formatDate(notification.createdAt)}</Text>
      </View>

      {isUnread && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 44,
  },
  containerUnread: {
    backgroundColor: '#F0F4FF',
  },
  containerRTL: {
    flexDirection: 'row-reverse',
  },
  content: {
    flex: 1,
    marginEnd: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  titleUnread: {
    color: '#111827',
    fontWeight: '700',
  },
  body: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 4,
  },
  bodyUnread: {
    color: '#374151',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    marginStart: 12,
  },
});
