import type { Href } from 'expo-router';
import type { AppStateStatus } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Linking } from 'react-native';
import { fetchNotifications } from '../store/use-notification-store';
import { notificationsService } from './notifications.service';

type ExpoNotificationsModule = typeof import('expo-notifications');
type ExpoNotification = import('expo-notifications').Notification;
type ExpoNotificationResponse = import('expo-notifications').NotificationResponse;

let notificationsModuleCache: ExpoNotificationsModule | null | undefined;

function getNotificationsModule(): ExpoNotificationsModule | null {
  if (notificationsModuleCache !== undefined) {
    return notificationsModuleCache;
  }

  try {
    // Lazy-load native module so app does not crash when running in a binary
    // that was built without expo-notifications.
    notificationsModuleCache = require('expo-notifications') as ExpoNotificationsModule;
  }
  catch (error) {
    console.warn('expo-notifications native module is unavailable in this build', error);
    notificationsModuleCache = null;
  }

  return notificationsModuleCache;
}

/**
 * Register Expo push token after authenticated parent session is ready
 * This ensures the JWT token is available for the authenticated API call
 */
export async function registerPushToken(): Promise<string | null> {
  try {
    const Notifications = getNotificationsModule();
    if (!Notifications) {
      return null;
    }

    // Check if device is physical (push tokens only work on physical devices)
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Request push permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permissions not granted');
      return null;
    }

    // Get Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.error('Project ID not found in Expo config');
      return null;
    }

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;

    // Register token with backend
    await notificationsService.registerDevice(token);
    console.log('Push token registered:', token);

    return token;
  }
  catch (error) {
    console.error('Failed to register push token:', error);
    return null;
  }
}

/**
 * Unregister device token on logout
 */
export async function unregisterPushToken(tokenId: string): Promise<void> {
  try {
    await notificationsService.unregisterDevice(tokenId);
    console.log('Push token unregistered:', tokenId);
  }
  catch (error) {
    console.error('Failed to unregister push token:', error);
  }
}

/**
 * Hook to handle push notifications in all app states
 * - Foreground: navigate to student attendance detail screen
 * - Background: navigate to student attendance detail screen
 * - Killed: launch app → resolve auth → navigate to student attendance detail screen
 */
export function usePushNotificationHandler() {
  const router = useRouter();

  useEffect(() => {
    const Notifications = getNotificationsModule();
    if (!Notifications) {
      return;
    }

    // Handle notification received while app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification: ExpoNotification) => {
      console.log('Notification received in foreground:', notification);
      // Notification is displayed automatically in foreground
    });

    // Handle notification tap (foreground, background, or killed state)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response: ExpoNotificationResponse) => {
      const deepLink = response.notification.request.content.data.deepLink as string | undefined;
      if (deepLink) {
        console.log('Navigating to deep link:', deepLink);
        router.push(deepLink as Href);
      }
    });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, [router]);
}

/**
 * Hook to detect push permission changes on app foreground
 * and refresh notification list
 */
export function usePushPermissionDetection() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };

    async function handleAppStateChange(state: AppStateStatus) {
      if (state === 'active') {
        // App came to foreground - refresh notifications
        console.log('App came to foreground, refreshing notifications');
        await fetchNotifications(true);
      }
    }
  }, []);
}

/**
 * Get current push notification permission status
 */
export async function getPushPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const Notifications = getNotificationsModule();
    if (!Notifications) {
      return 'undetermined';
    }

    const { status } = await Notifications.getPermissionsAsync();
    return status as 'granted' | 'denied' | 'undetermined';
  }
  catch (error) {
    console.error('Failed to get push permission status:', error);
    return 'undetermined';
  }
}

/**
 * Open device OS notification settings
 */
export async function openNotificationSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  }
  catch (error) {
    console.error('Failed to open notification settings:', error);
  }
}
