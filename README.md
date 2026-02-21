# EduApp Mobile

EduApp mobile application built on Expo + React Native, prepared for Privat Edu domains:
- Parent
- Teacher
- Admin
- Super Admin

## Stack
- Expo SDK 54
- React Native 0.81
- Expo Router
- TypeScript
- Zustand
- TanStack Query
- Uniwind/Tailwind styling

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm start
```

## Core Commands

```bash
pnpm doctor
pnpm lint
pnpm type-check
pnpm test
pnpm check-all
pnpm ios
pnpm android
```

## Architecture

- `src/app`: Route entrypoints and layout groups
- `src/modules`: Domain modules (`auth`, `parent`, `teacher`, `admin`, `super-admin`, `onboarding`, `common`)
- `src/core`: Shared runtime contracts (roles, routes, config, error codes, http client)
- `src/shared`: Shared types/constants
- `src/testing`: Shared test factories

Detailed docs:
- `docs/MOBILE_ARCHITECTURE.md`
- `docs/BOOTSTRAP_CHECKLIST.md`

## Environment

Required values are documented in `.env.example`.

Main keys:
- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_APP_ENV`
- `EXPO_ACCOUNT_OWNER` (optional for EAS cloud)
- `EAS_PROJECT_ID` (optional for EAS cloud)

## Repository

- Origin: [mohamed23231/EduApp](https://github.com/mohamed23231/EduApp)
