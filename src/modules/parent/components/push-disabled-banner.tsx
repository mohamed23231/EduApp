import type { PushPermissionStatus } from '../services/push-notification-handler';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui';
import { Color } from '@/components/ui/color-utils';
import {
  getPushPermissionStatus,
  openNotificationSettings,
} from '../services/push-notification-handler';

export function PushDisabledBanner() {
  const { t, i18n } = useTranslation();
  const [isPushDisabled, setIsPushDisabled] = useState(false);
  const [permissionStatus, setPermissionStatus]
    = useState<PushPermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);
  const showSettingsButton = permissionStatus !== 'unsupported';
  const message
    = permissionStatus === 'unsupported'
      ? `${t('parent.notifications.pushDisabled')} ${i18n.language.startsWith('ar') ? 'المحاكي لا يدعم الإشعارات الفورية.' : 'Simulator does not support push notifications.'}`
      : t('parent.notifications.pushDisabled');

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
      setPermissionStatus(status);
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
        <Ionicons name="notifications-off" size={20} color={Color.warning(500)} style={styles.icon} />
        <Text style={styles.message}>{message}</Text>
      </View>
      {showSettingsButton && (
        <TouchableOpacity
          onPress={handleOpenSettings}
          accessibilityRole="button"
          accessibilityLabel={t('parent.notifications.openSettings')}
          testID="open-settings-button"
        >
          <Ionicons name="chevron-forward" size={20} color={Color.blue(500)} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Color.warning(50),
    borderBottomWidth: 1,
    borderBottomColor: Color.warning(200),
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
    color: Color.warning(700),
    fontWeight: '500',
  },
});
