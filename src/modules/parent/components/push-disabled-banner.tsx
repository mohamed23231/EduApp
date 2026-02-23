import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui';
import { getPushPermissionStatus, openNotificationSettings } from '../services/push-notification-handler';

export function PushDisabledBanner() {
    const { t } = useTranslation();
    const [isPushDisabled, setIsPushDisabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        void checkPushPermission();

        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                void checkPushPermission();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const checkPushPermission = async () => {
        try {
            const status = await getPushPermissionStatus();
            setIsPushDisabled(status !== 'granted');
        }
        catch (error) {
            console.error('Failed to check push permission:', error);
        }
        finally {
            setIsLoading(false);
        }
    };

    const handleOpenSettings = async () => {
        await openNotificationSettings();
        // Re-check permission after returning from settings
        await checkPushPermission();
    };

    if (isLoading || !isPushDisabled) {
        return null;
    }

    return (
        <View
            style={styles.banner}
            accessibilityRole="alert"
            testID="push-disabled-banner"
        >
            <View style={styles.content}>
                <Ionicons name="notifications-off" size={20} color="#F59E0B" style={styles.icon} />
                <Text style={styles.message}>
                    {t('parent.notifications.pushDisabled')}
                </Text>
            </View>
            <TouchableOpacity
                onPress={handleOpenSettings}
                accessibilityRole="button"
                accessibilityLabel={t('parent.notifications.openSettings')}
                testID="open-settings-button"
            >
                <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        borderBottomWidth: 1,
        borderBottomColor: '#FCD34D',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 12,
    },
    message: {
        flex: 1,
        fontSize: 14,
        color: '#92400E',
        fontWeight: '500',
    },
});
