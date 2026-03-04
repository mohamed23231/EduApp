> PrivatEdu — Mobile app for parents, teachers, and admins in a tutoring platform.

## Technology Stack

- **Expo SDK 54** with React Native 0.81.5 — Managed workflow
- **TypeScript** — Strict mode throughout
- **Expo Router 6** — File-based routing (`src/app/`)
- **NativeWind/Tailwind** — Utility-first styling (prefer `className` over `StyleSheet.create`)
- **Zustand** — Global state (notifications, auth)
- **React Query** — Server state and data fetching
- **TanStack Form + Zod** — Form handling and validation
- **MMKV** — Encrypted local storage (not AsyncStorage)
- **i18next** — Internationalization (English + Arabic with full RTL support)
- **expo-notifications** — Push notification handling
- **Jest + React Testing Library** — Unit testing

## Project Structure

```
src/
├── app/                    # Expo Router file-based routes
│   ├── (parent)/           # Parent role routes (tabs, students, notifications)
│   ├── (teacher)/          # Teacher role routes
│   ├── (admin)/            # Admin routes
│   └── login.tsx, signup.tsx, onboarding.tsx
├── modules/                # Domain modules (THE MAIN CODE LIVES HERE)
│   ├── parent/             # Parent module
│   │   ├── screens/        # Dashboard, notifications, attendance, profile
│   │   ├── components/     # NotificationItem, NotificationBell, PushDisabledBanner
│   │   ├── services/       # API services, push handler, deep links
│   │   ├── store/          # Zustand stores (notifications)
│   │   ├── hooks/          # React Query hooks (useAttendance, etc.)
│   │   ├── types/          # TypeScript types
│   │   └── validators/     # Zod schemas
│   ├── teacher/            # Teacher module (same structure)
│   ├── auth/               # Auth module (login, signup, token management)
│   ├── onboarding/         # Onboarding flows
│   └── common/             # Shared utilities across modules
├── components/ui/          # Reusable UI components (Button, Text, Input, Modal, etc.)
├── lib/                    # Core utilities (api client, auth, i18n, storage)
├── translations/           # i18n files (en.json, ar.json)
└── global.css              # Tailwind/NativeWind theme configuration

Root Files:
├── app.config.ts           # Expo config (plugins, deep links, bundle IDs)
├── env.ts                  # Environment config (API URLs, bundle IDs)
├── google-services.json    # Firebase config for Android (tracked in git)
└── plugins/                # Custom Expo config plugins
```

## Commands

```bash
pnpm start                  # Start Metro dev server
pnpm android                # Run on Android
pnpm ios                    # Run on iOS
pnpm lint                   # ESLint
pnpm type-check             # TypeScript validation
pnpm test                   # Jest tests
pnpm check-all              # All quality checks
```

## Design System

### Colors
| Token | Value | Usage |
|---|---|---|
| Primary (brand) | `#FF7B1A` | Orange accent |
| Indigo | `#6366F1` / `#4F46E5` | Active tab, accent elements |
| Blue | `#3B82F6` / `#2563EB` | Links, actions |
| Success | `#22C55E` | Present status |
| Danger | `#EF4444` | Absent status, errors |
| Warning | `#F59E0B` | Excused status, warnings |
| Gray | `#9CA3AF` | Not marked, tertiary text |
| Text Primary | `#111827` | Headings, body text |
| Text Secondary | `#6B7280` | Supporting text |
| Surface | `#FFFFFF` | Cards, containers |
| Background | `#F9FAFB` | Screen backgrounds |

Color definitions: `src/components/ui/colors.js` and `src/components/ui/color-utils.ts`

### Icons
Use `@expo/vector-icons` (Ionicons) — already installed. Do NOT add new icon packages.

## Key Patterns

- **Module structure**: `src/modules/[role]/` with screens, components, services, hooks, store, types
- **Routing**: File-based via `src/app/` — grouped by role `(parent)`, `(teacher)`, etc.
- **Data fetching**: React Query hooks in `modules/[role]/hooks/`
- **API services**: Axios-based in `modules/[role]/services/`
- **Forms**: TanStack Form + Zod (not react-hook-form)
- **Storage**: MMKV via `src/lib/storage.tsx` for sensitive data
- **Imports**: Always `@/` prefix, never relative imports
- **Styling**: Prefer NativeWind `className` for new code
- **RTL**: All screens must support Arabic (RTL) layout

## Push Notifications

The app uses **Expo's managed push service** for notification delivery:

```
Backend (Railway) → Expo Push Service → FCM (Android) / APNs (iOS) → Device
```

### Key files
| File | Purpose |
|---|---|
| `modules/parent/services/push-notification-handler.ts` | Token registration, notification listeners, deep link navigation |
| `modules/parent/services/notification-deep-link.ts` | Deep link validation (only allows safe `/parent/students/:uuid/attendance` pattern) |
| `modules/parent/store/use-notification-store.ts` | Notification state, pagination, badge count |
| `modules/parent/services/notifications.service.ts` | API calls for notifications and device tokens |
| `modules/parent/components/notification-item.tsx` | Notification card component |
| `modules/parent/screens/notification-center-screen.tsx` | Notification list screen |

### Notification types
1. **Absence Alert** — student marked absent by teacher
2. **Low Performance Alert** — student received a low rating

### Firebase setup
- `google-services.json` lives at the **project root** (NOT in `android/app/`) — Expo copies it during prebuild
- FCM V1 Service Account credentials must be uploaded at expo.dev → Project → Credentials → Android → your package identifier
- `EXPO_ACCESS_TOKEN` env var required on the backend for Expo Push API auth

## Backend

The backend is a **NestJS** app deployed on **Railway** (`tutoring-backend/`).

Key push-related modules:
- `tutoring-backend/src/modules/push/push.service.ts` — Device token storage, Expo Push API calls
- `tutoring-backend/src/modules/push/push.worker.ts` — Background job processor with circuit breaker
- `tutoring-backend/src/modules/parents/parents.service.ts` — Attendance timeline/statistics queries

## Essential Rules

- ✅ Use absolute imports: `@/components/ui/button`
- ✅ Use module structure: `src/modules/[role]/`
- ✅ Use TanStack Form for forms
- ✅ Use MMKV for sensitive storage
- ✅ Use Expo config plugins for native changes
- ✅ Use EAS Build for production builds
- ✅ Prefix env vars with `EXPO_PUBLIC_*` for app access
- ✅ Support RTL (Arabic) in all screens
- ❌ DO NOT modify `android/` or `ios/` directly — use config plugins in `app.config.ts`
- ❌ DO NOT use AsyncStorage — use MMKV
- ❌ DO NOT add new icon packages — use Ionicons from `@expo/vector-icons`
- ❌ DO NOT use relative imports

## Emulator Testing (Android Push)

- Use a **Google Play** emulator image (e.g., `Pixel_7_API_35` with `google_apis_playstore` tag)
- After launching emulator, run: `adb reverse tcp:8081 tcp:8081 && adb reverse tcp:9090 tcp:9090`
- If network errors occur, clear proxy: `adb shell settings delete global http_proxy`
- iOS Simulator does NOT support push notifications — use a physical iPhone

## Documentation

- `docs/PUSH_NOTIFICATIONS_KT.md` — Full push notification knowledge transfer (setup, flow, bugs fixed)
- `docs/MOBILE_ARCHITECTURE.md` — Architecture overview
