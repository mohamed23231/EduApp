import { useTranslation } from 'react-i18next';
import { I18nManager, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui';

interface Notification {
    id: string;
    notificationType: string;
    titleKey: string;
    bodyKey: string;
    bodyParams: Record<string, string>;
    status: 'READ' | 'UNREAD';
    createdAt: string;
    readAt: string | null;
    deepLink: string;
}

interface NotificationItemProps {
    notification: Notification;
    onPress: () => void;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
    const { t } = useTranslation();
    const isUnread = notification.status === 'UNREAD';

    // Resolve title and body from localization keys
    const title = t(notification.titleKey);
    const bodyTemplate = t(notification.bodyKey);

    // Interpolate body params
    let body = bodyTemplate;
    Object.entries(notification.bodyParams).forEach(([key, value]) => {
        body = body.replace(`{${key}}`, value);
    });

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
