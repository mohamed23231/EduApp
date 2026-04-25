const PARENT_ATTENDANCE_DEEP_LINK_PATTERN
  = /^\/\(parent\)\/students\/[0-9a-f-]{36}\/attendance$/i;

export function isSafeParentNotificationDeepLink(deepLink: string): boolean {
  return PARENT_ATTENDANCE_DEEP_LINK_PATTERN.test(deepLink);
}
