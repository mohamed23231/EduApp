---
name: expo-workflow
description: Expo Router + EAS workflow for adding screens, native modules, and deploying mobile builds. Use when adding a new route, swapping a native dep, or shipping a release.
---

# Expo Workflow

## Adding a new screen

1. Decide the role: `(parent)`, `(teacher)`, `(admin)`, or auth-public.
2. Create the route file: `src/app/(parent)/students/[id]/profile.tsx`.
3. The actual logic lives in `src/modules/parent/screens/StudentProfileScreen.tsx`. The route file just imports and renders it.
4. Add translation keys to `src/translations/en.json` AND `src/translations/ar.json`.
5. Verify RTL by toggling locale in app settings.

## Adding a native module

1. `pnpm add <module>` (or `pnpm add expo-<module>` for Expo-managed wrappers).
2. Add any required config to `app.config.ts` (permissions, plugins).
3. `eas build --profile development --platform android` (and `ios` if testing).
4. Install the new dev-client build on the test device.
5. Restart Metro: `pnpm start --clear`.

JS-only deps don't need an EAS rebuild — they hot reload.

## Adding a config plugin

1. Create `plugins/withMyPlugin.ts` exporting a `ConfigPlugin`.
2. Register in `app.config.ts` `plugins` array (order matters for some plugins).
3. EAS rebuild.

## Updating the app — OTA vs binary

- JS / asset changes: `eas update --branch <production|preview>` (over-the-air, no store review).
- Native changes (new module, plugin, permission): full binary build + store review.

## Translations workflow

1. Add new keys to `src/translations/en.json`.
2. Translate to `src/translations/ar.json` (Arabic-first if writing fresh).
3. Use `t('namespace.key', 'English fallback')` in code.
4. Verify both directions render correctly.

## Pre-PR checklist (mobile)

- [ ] `pnpm check-all` passes (lint + type-check + test).
- [ ] No `any`, no `as any`, no relative imports.
- [ ] All new strings in BOTH `en.json` and `ar.json`.
- [ ] RTL verified (icons flip, margins use logical properties).
- [ ] No `StyleSheet.create({})` for new code.
- [ ] No `AsyncStorage`.
- [ ] Tests added for new logic.
