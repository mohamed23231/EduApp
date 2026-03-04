import type {
  Notification as ExpoNotification,
  NotificationResponse as ExpoNotificationResponse,
} from 'expo-notifications';
import type * as ExpoNotifications from 'expo-notifications';
import type { Href } from 'expo-router';
import type { AppStateStatus } from 'react-native';
import { isAxiosError } from 'axios';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { getAuthUser, getToken } from '@/lib/auth/utils';
import {
  getPushDeviceRegistration,
  PUSH_DEVICE_REFRESH_INTERVAL_MS,
  setPushDeviceRegistration,
} from '@/lib/push-device-registration';
import { fetchNotifications } from '../store/use-notification-store';
import { isSafeParentNotificationDeepLink } from './notification-deep-link';
import { notificationsService } from './notifications.service';
import { bestEffortUnregisterPushToken } from './push-device-unregister';

type ExpoNotificationsModule = typeof ExpoNotifications;
export type PushPermissionStatus
  = 'granted'
    | 'denied'
    | 'undetermined'
    | 'unsupported';

let notificationsModuleCache: ExpoNotificationsModule | null | undefined;
let registerInFlightPromise: Promise<string | null> | null = null;
let androidChannelConfigured = false;
let notificationPresentationConfigured = false;
let notificationsSyncInFlight: Promise<void> | null = null;
let lastNotificationsSyncAt = 0;

const MIN_NOTIFICATION_SYNC_INTERVAL_MS = 1500;

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

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureAndroidNotificationChannel(
  Notifications: ExpoNotificationsModule,
): Promise<void> {
  if (androidChannelConfigured) {
    return;
  }

  if (Device.osName !== 'Android') {
    androidChannelConfigured = true;
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
      sound: 'default',
    });
    androidChannelConfigured = true;
  }
  catch (error) {
    console.error('Failed to configure Android notification channel:', error);
  }
}

function configureNotificationPresentation(
  Notifications: ExpoNotificationsModule,
): void {
  if (notificationPresentationConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  notificationPresentationConfigured = true;
}

function handleNotificationResponse(
  response: ExpoNotificationResponse,
  router: ReturnType<typeof useRouter>,
) {
  const deepLink = response.notification.request.content.data.deepLink as string | undefined;
  if (deepLink && isSafeParentNotificationDeepLink(deepLink)) {
    if (__DEV__) {
      console.log('Navigating to deep link:', deepLink);
    }
    router.push(deepLink as Href);
  }
  else if (deepLink) {
    console.warn('[Push] Ignoring unsafe deep link payload', deepLink);
  }
  void syncNotifications(true);
}

/**
 * Register Expo push token after authenticated parent session is ready
 * This ensures the JWT token is available for the authenticated API call
 */
// eslint-disable-next-line max-lines-per-function
export async function registerPushToken(): Promise<string | null> {
  if (registerInFlightPromise) {
    return registerInFlightPromise;
  }

  registerInFlightPromise = (async () => {
    try {
      const Notifications = getNotificationsModule();
      if (!Notifications) {
        return null;
      }

      // Check if device is physical (push tokens only work on physical devices)
      // In dev mode we allow emulators so the full notification flow can be tested
      if (!Device.isDevice && !__DEV__) {
        return null;
      }
      if (!Device.isDevice && __DEV__) {
        console.log('[Push] Running on emulator — token registration allowed in dev mode');
      }

      // Request push permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        if (__DEV__) {
          console.log('Push notification permissions not granted');
        }
        return null;
      }

      await ensureAndroidNotificationChannel(Notifications);
      configureNotificationPresentation(Notifications);

      // Get Expo push token
      const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.error('Project ID not found in Expo config');
        return null;
      }

      let token: string;
      try {
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
      }
      catch (fcmError) {
        if (__DEV__) {
          console.warn(
            '[Push] getExpoPushTokenAsync failed on emulator (FCM not configured). '
            + 'Push notifications require a Google Play emulator image with FCM credentials. '
            + 'Use a physical device or a Google Play emulator for full push testing.',
            fcmError,
          );
        }
        return null;
      }

      const currentParentId = getAuthUser()?.id;
      const existingRegistration = getPushDeviceRegistration();
      const isFreshRegistration
        = existingRegistration?.token === token
          && !!existingRegistration.id
          && !!currentParentId
          && existingRegistration.parentId === currentParentId
          && Date.now() - existingRegistration.registeredAt
          < PUSH_DEVICE_REFRESH_INTERVAL_MS;
      if (isFreshRegistration) {
        return token;
      }

      // Register token with backend with short retry window. This covers app-start
      // races where auth headers might not be fully hydrated yet.
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const device = await notificationsService.registerDevice(token);
          setPushDeviceRegistration({ id: device.id, token: device.token, parentId: currentParentId });
          if (__DEV__) {
            console.log('Push token registered:', device.token);
          }
          return device.token;
        }
        catch (error) {
          if (isAxiosError(error)) {
            const status = error.response?.status;
            const data = error.response?.data;
            console.error(
              `[Push] registerDevice failed (attempt ${attempt}/${maxAttempts})`,
              { status, data },
            );
          }
          else {
            console.error(
              `[Push] registerDevice failed (attempt ${attempt}/${maxAttempts})`,
              error,
            );
          }

          if (attempt < maxAttempts) {
            await delay(500 * attempt);
          }
        }
      }

      return null;
    }
    catch (error) {
      console.error('Failed to register push token:', error);
      return null;
    }
    finally {
      registerInFlightPromise = null;
    }
  })();

  return registerInFlightPromise;
}

/**
 * Best-effort realtime sync for unread badge / list after notification events
 */
async function syncNotifications(force = false) {
  const now = Date.now();
  if (!force && now - lastNotificationsSyncAt < MIN_NOTIFICATION_SYNC_INTERVAL_MS) {
    return;
  }

  if (notificationsSyncInFlight) {
    await notificationsSyncInFlight;
    return;
  }

  notificationsSyncInFlight = (async () => {
    try {
      await fetchNotifications(true);
      lastNotificationsSyncAt = Date.now();
    }
    catch (error) {
      console.error('[Push] Failed to sync notifications:', error);
    }
    finally {
      notificationsSyncInFlight = null;
    }
  })();

  await notificationsSyncInFlight;
}

/**
 * Unregister device token on logout
 */
export async function unregisterPushToken(tokenId: string): Promise<void> {
  await bestEffortUnregisterPushToken({
    tokenId,
    accessToken: getToken()?.access ?? null,
  });
  if (__DEV__) {
    console.log('Push token unregistered:', tokenId);
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

    void ensureAndroidNotificationChannel(Notifications);

    // Handle notification interaction that launched the app from a terminated state.
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response, router);
      }
    }).catch((error) => {
      console.error('Failed to read last notification response:', error);
    });

    // Handle notification received while app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification: ExpoNotification) => {
      if (__DEV__) {
        console.log('Notification received in foreground:', notification);
      }
      void syncNotifications();
    });

    // Handle notification tap (foreground, background, or killed state)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response: ExpoNotificationResponse) => {
      handleNotificationResponse(response, router);
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
        // Retry token registration after app returns to foreground. This
        // recovers from cases where auth or native permission state was not
        // fully ready during initial app mount.
        await registerPushToken();
        // App came to foreground - refresh notifications
        if (__DEV__) {
          console.log('App came to foreground, refreshing notifications');
        }
        await syncNotifications(true);
      }
    }
  }, []);
}

/**
 * Get current push notification permission status
 */
export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  try {
    if (!Device.isDevice && !__DEV__) {
      return 'unsupported';
    }

    const Notifications = getNotificationsModule();
    if (!Notifications) {
      return 'undetermined';
    }

    const { status } = await Notifications.getPermissionsAsync();
    return status as PushPermissionStatus;
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
    if (Platform.OS === 'ios') {
      const iosSettingsUrl = 'app-settings:';
      const canOpen = await Linking.canOpenURL(iosSettingsUrl);
      if (canOpen) {
        await Linking.openURL(iosSettingsUrl);
        return;
      }
    }
    await Linking.openSettings();
  }
  catch (error) {
    console.error('Failed to open notification settings:', error);
  }
}
