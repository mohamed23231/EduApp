---
name: mmkv-storage
description: MMKV is the only allowed storage. AsyncStorage is forbidden. Encrypt sensitive data; namespace your keys.
globs:
  - mobile-app/src/lib/storage.tsx
  - mobile-app/src/lib/storage.ts
  - mobile-app/src/**/store/*.ts
  - mobile-app/src/modules/auth/**/*.ts
---

# MMKV Storage Rules

## The rule

`react-native-async-storage` is **forbidden** in this codebase. All persistence goes through MMKV via the wrapper at `@/lib/storage`.

If you find AsyncStorage usage in older code, leave it unless your task involves that area — then migrate it.

## Sensitive vs non-sensitive

The MMKV wrapper exposes:

- `secureStorage` — encrypted instance (key-derived, app-only). For: JWTs, refresh tokens, OTP secrets, parent auth state.
- `appStorage` — non-encrypted instance. For: user preferences (locale, theme), seen-onboarding flag, feature flags.

Pick the right one based on sensitivity. Never store JWTs in `appStorage`.

## Namespaced keys

Use the `<role>.<feature>.<key>` pattern:

- `auth.tokens.access`
- `auth.tokens.refresh`
- `parent.deviceRegistration`
- `parent.notifications.lastSync`
- `app.locale`
- `app.theme`

This avoids collisions and makes a wipe easy (`secureStorage.deleteAll()` on logout, `appStorage.delete('parent.*')` on parent unlink).

## Synchronous vs async

MMKV is synchronous — that's its win over AsyncStorage. You can read storage in render code without the `useEffect` + state dance. But:

- Don't store huge blobs (>1MB). MMKV is fast but isn't a database.
- Don't iterate over keys in render. Cache the result.

## Migration / versioning

If a stored shape changes:

1. Bump a version key (`auth.tokens.version`).
2. On read, check the version and migrate if old.
3. Never silently drop the old data — log it once via the audit telemetry.

## What NOT to do

- ❌ Import `@react-native-async-storage/async-storage`.
- ❌ Store JWTs in `appStorage`.
- ❌ Stringify/parse JSON manually for every read — wrap typed helpers.
- ❌ Stash entire React Query caches in MMKV (it has its own persister if needed).
- ❌ Use MMKV from a non-RN context (Node tests, Storybook web). Use a mock.
