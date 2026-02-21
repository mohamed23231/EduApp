# Bootstrap Checklist

## 1) Environment and Identity
- Set `EXPO_PUBLIC_API_URL` in `.env`.
- Set `EXPO_ACCOUNT_OWNER` and `EAS_PROJECT_ID` for cloud builds.
- Verify bundle IDs and package names in `env.ts`.

## 2) API and Auth Baseline
- Wire token injection in the API client interceptor.
- Implement centralized unauthorized handling and session reset.
- Add role-aware navigation guards for parent/teacher/admin/super-admin route groups.

## 3) Feature Foundation
- Move auth, onboarding, and dashboard pages from `src/features` into corresponding `src/modules` directories.
- Add typed API clients for parent, teacher, admin, and super admin domains.
- Add zod validators for all mutation payloads.

## 4) Quality Gates
- Run `pnpm lint`, `pnpm type-check`, `pnpm test` in CI for every PR.
- Add smoke tests per domain route group.
- Add contract tests for key API envelopes.

## 5) Release Readiness
- Configure EAS `development`, `preview`, and `production` profiles.
- Add crash reporting and analytics.
- Configure rollout checklist and rollback criteria.
