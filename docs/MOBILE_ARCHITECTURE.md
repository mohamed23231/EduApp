# Privat Edu Mobile Architecture

## Intent
This app is structured for domain isolation, testability, and safe parallel work across teams.

## Layer Model
- `src/app/`: Expo Router entrypoints only (route groups, layouts, page containers).
- `src/modules/`: Domain modules (Auth, Parent, Teacher, Admin, Super Admin, Onboarding, Common).
- `src/core/`: Cross-domain runtime concerns (routing contract, auth roles, config, error codes, HTTP client).
- `src/shared/`: Reusable primitives (shared types and constants).
- `src/testing/`: Shared test factories and testing helpers.
- `src/features/`: Legacy template screens (kept for incremental migration).

## Domain Rules
- Route files under `src/app/*` can compose module screens; business logic belongs in `src/modules/*`.
- `src/modules/*` must not import from other domain modules directly. Use `src/core` or `src/shared` for shared contracts.
- API contracts live in module `types/` and shared envelope types in `src/shared/types/api.ts`.
- Query keys are centralized in `src/shared/constants/query-keys.ts`.

## Suggested Module Internal Structure
- `components/`: Dumb or domain-aware UI components.
- `hooks/`: Query/mutation hooks and local state hooks.
- `screens/`: Screen-level containers.
- `services/`: API orchestration and mappers.
- `types/`: Domain request/response contracts.
- `validators/`: zod schemas and input contracts.

## Migration Note
Existing template files in `src/features/*` continue to work and should be migrated module-by-module into `src/modules/*`.
