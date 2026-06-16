# Code-Review Pitfalls (Mobile)

Recurring issues caught by reviewers (cubic, reviewdog/`better-tailwindcss`) on the redesign PR. Check these proactively — they are cheap to get right and expensive to chase in review.

## 1. Font / Tailwind utility classes must be theme-registered

NativeWind/Tailwind v4 lives in `src/global.css` under `@theme`. The eslint rule `better-tailwindcss/no-unknown-classes` (entryPoint = `src/global.css`) flags any `font-*` / `bg-*` / `text-*` class that has no backing token.

- **Font-family namespace is `--font-*`, NOT `--font-family-*`.** `--font-inter` generates the `font-inter` utility. `--font-family-inter` generates nothing usable, so `font-inter` stays "unknown" and the class is a no-op (text silently falls back to the system font).
- Before using a `font-x` class, confirm a `--font-x` token exists in `@theme`. If you add a font, add the `--font-<name>` token in the same change.
- Don't introduce a new `font-*`/color class that isn't in the theme — eslint will flag every call site (one redesign PR drew 49 `font-inter` warnings this way).

## 2. Maestro testIDs must match what the component actually emits

E2E `assertVisible` / `tapOn` `id:` values must reference a testID the target component **actually renders**. Verify in source before writing the flow — a wrong id is a silent runtime failure, not a compile error.

Known emitters (verify, don't assume):
- `components/ui/phone-field.tsx` with `testIDPrefix="x"` → `x-country-picker` and `x-local`. **There is no `x-input`.**
- `onboarding/full-name-field.tsx` → `fullName-input`.
- `onboarding/role-pill-row.tsx` → `role-card-teacher` / `role-card-parent`.

Rules:
- Never invent a `-input` suffix for compound fields.
- Don't write a TODO claiming "component X has no testID" without grepping for `testID` in X first — inaccurate TODOs mislead the next author.
- Every `tapOn` that navigates should be followed by a non-`optional` `assertVisible` on a stable anchor of the destination, so a broken route fails the flow instead of passing silently.
- Prefer a real testID over screen-title text; if the needed testID is missing, leave a precise TODO naming it (`student-create-screen-root`, etc.) rather than asserting on translatable copy.

## 3. Accessibility props must win over `{...props}`

In shared interactive primitives, spread caller `{...props}` **before** the component's explicit `accessibilityRole` / `accessibilityState` / `accessibilityLabel`, so a caller can't silently strip the component's a11y contract:

```tsx
<Pressable
  {...props}                                   // caller extras first
  accessibilityRole="button"                   // component intent wins
  accessibilityState={{ disabled, busy }}
  accessibilityLabel={props.accessibilityLabel ?? text}
/>
```

## 4. Guard remote/JSON payloads before property access

A response can be `null` or a non-object even on HTTP 200. React Query's `const { data = {} }` default only fills in for `undefined`, **not** `null` — so `data.legal?.x` still throws on a `null` body. Normalize at the fetch boundary:

```ts
return (data && typeof data === 'object' ? data : {}) as RemoteAppSettings;
```

## 5. Prefer the library hook over a hand-rolled subscription

If a native-module package ships a hook (e.g. `useNetInfo()` from `@react-native-community/netinfo`), use it instead of re-implementing `addEventListener` + `useState` + `useEffect`. Less surface, fewer cleanup bugs. When you swap to a named-export hook, update the matching `jest-setup.ts` mock to expose that export.

## 6. Never hide the backend's user-facing error message

This backend (NestJS) returns controlled, user-safe messages via global exception filters (`{ statusCode, message }`). So:
- **Show it.** Use `getApiErrorMessage(err, t('...generic...'))` from `@/shared/services/api-utils` — it extracts the backend `message` field (and translates `AUTH_*` codes via the optional `codeTranslator`), falling back to the i18n string. This is the established pattern across the manager screens.
- ❌ Don't show **raw** `err.message` directly — for an axios error that's `"Request failed with status code 400"`, not the backend message.
- ❌ Don't replace it with a **generic-only** string — that throws away the actionable backend message (e.g. "Invitation expired"). That over-correction degrades UX.
- ✅ Do `console.error('[scope] failed', err)` for logging **and** surface `getApiErrorMessage(...)` to the user.

## 7. Routes: always `AppRoute.*`, never strings or casts

- Use `AppRoute.*` constants from `@/core/navigation/routes`. Never hardcode `'/(teacher)/(tabs)/dashboard'` or `'/login'`.
- Never `as any` / `as never` on a `router.push/replace`/`<Redirect href>` — if a literal needs the cast, the route constant is missing; add it to `AppRoute` instead.
- ⚠️ Verify the constant resolves to the **intended** path — similarly-named routes can coexist (`(teacher)/dashboard.tsx` vs `(teacher)/(tabs)/dashboard.tsx`). Swapping to the wrong one is a navigation bug, not a cleanup.

## 8. Colors: tokens only, never hex or palette classes

- Never hardcode hex (`#9CA3AF`, `#DC2626`, `#F9FAFB`, `#3B82F6`, …) or raw Tailwind palette classes (`slate-*`, `blue-*`, `cyan-*`, `gray-*`, `amber-N`).
- Map to tokens: gray→`colors.neutral.dim`/`inkMuted` (or `text-ink-muted`/`text-dim`); red→`colors.semantic.absent`/`text-absent`; warning amber→`excused`/`text-excused-ink bg-excused-soft`; off-white→`colors.neutral.paper`/`bg-paper`.
- See `styling.md` for the full token list. `better-tailwindcss/no-unknown-classes` + `check-redesign.mjs` enforce this.

## 9. React keys, forms, filenames

- **Keys:** never `key={index}`; use a stable id (`key={item.id}` or a constant id list for static skeletons).
- **TanStack forms:** always attach a Zod `validators` schema — without it `canSubmit` defaults to `true` and empty submits go through.
- **Filenames:** Expo Router catch-all is `[...missing].tsx` (not `messing`); files with no JSX use `.ts`, not `.tsx`. On a route rename, update `specs/002-ui-redesign/route-inventory.md` (the `redesign-route-inventory` test enforces it).

## 10. Collapse speculative multi-shape response parsing

When a client normalizes several response shapes (`{ user: {...} }` vs flat `{ userId, ... }`), verify what the backend (`tutoring-backend/`) actually returns and keep only that branch. Don't carry speculative branches "just in case" — they rot and hide the real contract.
