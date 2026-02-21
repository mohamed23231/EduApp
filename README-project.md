# Privat Edu Mobile

Production-ready Expo mobile foundation for Privat Edu domains: Parent, Teacher, Admin, and Super Admin.

## Quick Start

```bash
pnpm install
cp .env.example .env
pnpm start
```

## Main Scripts

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm check-all
pnpm ios
pnpm android
```

## Project Layout

- `src/app/`: Expo Router entrypoints and layouts.
- `src/modules/`: Domain modules (auth, onboarding, parent, teacher, admin, super-admin, common).
- `src/core/`: App-wide contracts (roles, routes, config, error codes, http client).
- `src/shared/`: Shared contracts/constants.
- `src/testing/`: Shared factories and test utilities.
- `src/features/`: Legacy template layer kept for gradual migration.

## Architecture Docs

- `docs/MOBILE_ARCHITECTURE.md`
- `docs/BOOTSTRAP_CHECKLIST.md`

## Environment

- `.env.example` contains required keys.
- Set `EXPO_ACCOUNT_OWNER` and `EAS_PROJECT_ID` before cloud builds.
- Update `env.ts` if you need different bundle IDs/schemes.
