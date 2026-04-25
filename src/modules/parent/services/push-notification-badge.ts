import type * as ExpoNotifications from 'expo-notifications';

type ExpoNotificationsModule = typeof ExpoNotifications;

let notificationsModuleCache: ExpoNotificationsModule | null | undefined;

function getNotificationsModule(): ExpoNotificationsModule | null {
  if (notificationsModuleCache !== undefined) {
    return notificationsModuleCache;
  }

  try {
    notificationsModuleCache = require('expo-notifications') as ExpoNotificationsModule;
  }
  catch {
    notificationsModuleCache = null;
  }

  return notificationsModuleCache;
}

export async function setNotificationBadgeCount(count: number): Promise<void> {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return;
  }

  try {
    await Notifications.setBadgeCountAsync(Math.max(0, Math.trunc(count)));
  }
  catch (error) {
    if (__DEV__) {
      console.warn('[Push] Failed to set badge count', error);
    }
  }
}
