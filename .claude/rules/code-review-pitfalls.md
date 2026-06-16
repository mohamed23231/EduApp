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
