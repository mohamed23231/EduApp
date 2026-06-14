import type * as React from 'react';
import * as Sentry from '@sentry/react-native';

/**
 * Sentry crash/error reporting bootstrap.
 *
 * Initialization is gated entirely on `EXPO_PUBLIC_SENTRY_DSN`. When the env
 * var is unset (local dev, tests, CI without a DSN configured) `initSentry()`
 * is a no-op and the app behaves exactly as it did before Sentry was added —
 * no client is created, no network calls, no native bridge activity.
 *
 * The DSN is the only configuration source. Never hardcode a DSN or auth token
 * here; the auth token is a build-time secret that lives only in EAS / CI.
 */

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';

/** True only when a DSN is present and Sentry should be active. */
export const isSentryEnabled = Boolean(SENTRY_DSN);

/**
 * Initialize Sentry if (and only if) a DSN is configured.
 * Safe to call once at app root; returns early when no DSN is set.
 */
export function initSentry(): void {
  if (!isSentryEnabled) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: APP_ENV,
    // Disable verbose SDK logging in production builds.
    debug: APP_ENV === 'development',
    // Trace sampling: off by default; enable per-environment later if needed.
    tracesSampleRate: 0,
    enabled: true,
  });
}

/**
 * Wrap the root component with Sentry's error/touch instrumentation when a DSN
 * is configured. When disabled, returns the component untouched so the tree is
 * identical to the pre-Sentry app.
 *
 * Typed for the Expo Router root layout, which renders without props.
 */
export function withSentry(
  RootComponent: React.ComponentType<Record<string, never>>,
): React.ComponentType<Record<string, never>> {
  if (!isSentryEnabled) {
    return RootComponent;
  }

  return Sentry.wrap(RootComponent);
}
