---
name: push-notifications
description: Expo push pipeline — locale-aware, MMKV-persisted, deep-link-safe.
globs:
  - mobile-app/src/modules/parent/services/push-notification-handler.ts
  - mobile-app/src/modules/parent/services/notification-deep-link.ts
  - mobile-app/src/modules/parent/services/notifications.service.ts
  - mobile-app/src/modules/parent/store/use-notification-store.ts
  - mobile-app/src/lib/push-device-registration.ts
---

# Push Notification Rules

## Pipeline

```
Backend (Railway) → Expo Push Service → FCM/APNs → Device → push-notification-handler.ts
```

- The backend NEVER calls FCM/APNs directly. It always goes through Expo's push service.
- Token format: `ExponentPushToken[xxxxxx]`. Validate with `Expo.isExpoPushToken()` if needed.

## Locale-aware delivery

The backend sends the notification **in the device's language**, not the account's language. The contract:

1. Mobile registers the token via `POST /parents/devices` with `{ token, locale }` where `locale ∈ { 'en', 'ar' }`.
2. Backend stores `device_tokens.locale` — this is the source of truth for that device's language.
3. Backend `push.worker.ts` reads `deviceToken.locale` and picks the matching string from `messages.ts`.
4. If the user changes app language, MMKV detects the diff at next launch and re-registers with the new locale.

**Never** read locale from the parent's User record — `device_tokens.locale` is canonical for that device.

## MMKV persistence

- `lib/push-device-registration.ts` stores `{ id, token, parentId, locale }` in MMKV.
- On startup, the handler reads MMKV and either confirms the registration or re-registers if anything changed.
- Don't use AsyncStorage. Don't use `react-native-mmkv` directly — go through `@/lib/storage`.

## Deep links — allowlist only

`notification-deep-link.ts` only allows `/parent/students/:uuid/attendance`. Any other URL is dropped silently. Extend the allowlist (with regex tested) before adding a new tap target.

The user can craft notification payloads via a compromised account; never trust the URL.

## Listeners — cleanup on unmount

```tsx
useEffect(() => {
  const sub = Notifications.addNotificationResponseReceivedListener(handleTap);
  return () => sub.remove();
}, []);
```

## Badge count

Synced via the Zustand `use-notification-store.ts`. The unread count comes from the backend on `GET /notifications`. Badge updates via `Notifications.setBadgeCountAsync(unreadCount)`.

## What NOT to do

- ❌ Read locale from the parent User entity (use `device_tokens.locale`).
- ❌ Open arbitrary URLs from notification payloads.
- ❌ Persist tokens in AsyncStorage.
- ❌ Direct FCM/APNs calls — always Expo Push.
- ❌ `Notifications.scheduleLocalNotificationAsync` for things that should come from the server.
- ❌ Forget to validate the `Idempotency-Key` was sent (backend dedup relies on it).
