import type * as ExpoNotifications from 'expo-notifications';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import colors from '@/components/ui/colors';
import { ConnectivityBanner } from '@/components/ui/connectivity-banner';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/components/ui/theme';
import { ToastHost } from '@/components/ui/toast-host';
import { useThemeConfig } from '@/components/ui/use-theme-config';
import { UserRole } from '@/core/auth/roles';
import { getHomeRouteForRole } from '@/core/auth/routing';
import { AppRoute } from '@/core/navigation/routes';
import {
  clearOnboardingContext,
  hydrateAuth,
  setOnboardingContext,
  signIn,
} from '@/features/auth/use-auth-store';
import { APIProvider } from '@/lib/api';
import { initSentry, withSentry } from '@/lib/sentry';
import { setItem } from '@/lib/storage';
import { getOnboardingContext, validateToken } from '@/modules/auth/services';
import '@/lib/i18n';
// Import  global CSS file
import '../global.css';

export { ErrorBoundary } from 'expo-router';

// Initialize Sentry as early as possible. No-op unless EXPO_PUBLIC_SENTRY_DSN is set.
initSentry();

// Keep splash visible until bootstrap completes.
void SplashScreen.preventAutoHideAsync().catch(() => { });

// eslint-disable-next-line react-refresh/only-export-components
export const unstable_settings = {
  initialRouteName: 'login',
};

type ExpoNotificationsModule = typeof ExpoNotifications;

function normalizePath(path?: string | null): string {
  return (path ?? '').replace(/^\/+|\/+$/g, '').toLowerCase();
}

function extractLinkParams(url: string, queryParams?: Linking.QueryParams): Record<string, string> {
  const params: Record<string, string> = {};

  for (const [key, value] of Object.entries(queryParams ?? {})) {
    if (typeof value === 'string') {
      params[key] = value;
    }
  }

  const hashIndex = url.indexOf('#');
  if (hashIndex >= 0) {
    const hash = url.slice(hashIndex + 1);
    const hashParams = new URLSearchParams(hash);

    hashParams.forEach((value, key) => {
      params[key] = value;
    });
  }

  return params;
}

function toOnboardingRole(role?: UserRole): 'TEACHER' | 'PARENT' | 'MANAGER' | undefined {
  if (role === UserRole.TEACHER || role === UserRole.PARENT || role === UserRole.MANAGER) {
    return role;
  }

  return undefined;
}

async function completeAuthCallback(
  params: Record<string, string>,
  router: ReturnType<typeof useRouter>,
): Promise<boolean> {
  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;

  if (!accessToken || !refreshToken) {
    return false;
  }

  const token = { access: accessToken, refresh: refreshToken };
  signIn({ token, user: null });

  try {
    const validatedUser = await validateToken();
    clearOnboardingContext();
    signIn({ token, user: validatedUser });
    router.replace(getHomeRouteForRole(validatedUser.role));
    return true;
  }
  catch {
    try {
      const onboarding = await getOnboardingContext();
      const onboardingRole = toOnboardingRole(onboarding.role);

      setOnboardingContext({
        email: onboarding.email ?? '',
        ...(onboarding.fullName ? { fullName: onboarding.fullName } : {}),
        ...(onboarding.phoneE164 ? { phone: onboarding.phoneE164 } : {}),
        ...(onboardingRole ? { role: onboardingRole } : {}),
      });

      if (onboardingRole === UserRole.MANAGER) {
        router.replace(AppRoute.manager.setup);
      }
      else {
        router.replace(AppRoute.auth.onboarding);
      }

      return true;
    }
    catch {
      router.replace(AppRoute.auth.login);
      return true;
    }
  }
}

/**
 * Deep-link handler for password reset URLs.
 * Listens for Universal Links (iOS) and App Links (Android) matching /reset-password.
 * Extracts token params and navigates to the reset-password screen.
 * Requirements: 7.1, 7.2, 11.2
 */
function useDeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    const handledUrls = new Set<string>();

    const handleUrl = async (url: string) => {
      if (handledUrls.has(url)) {
        return;
      }
      handledUrls.add(url);

      const parsed = Linking.parse(url);
      const normalizedPath = normalizePath(parsed.path);
      const params = extractLinkParams(url, parsed.queryParams ?? undefined);

      if (normalizedPath === 'reset-password') {
        const code = params.code;
        const accessToken = params.access_token;
        const refreshToken = params.refresh_token;

        if (code) {
          router.push({ pathname: AppRoute.auth.resetPassword, params: { code } });
        }
        else if (accessToken && refreshToken) {
          router.push({ pathname: AppRoute.auth.resetPassword, params: { access_token: accessToken, refresh_token: refreshToken } });
        }
        return;
      }

      if (normalizedPath === 'org-invite') {
        const token = params.token;
        if (token && token.length > 0) {
          void setItem('pendingOrgInviteToken', token);
          router.push({ pathname: '/org-invite' as any, params: { token } });
        }
        return;
      }

      if (await completeAuthCallback(params, router)) {
        return;
      }

      if (normalizedPath === 'manager' || normalizedPath === 'manager/setup') {
        router.replace(AppRoute.manager.setup);
        return;
      }

      if (normalizedPath === 'manager/dashboard') {
        router.replace(AppRoute.manager.dashboard);
      }
    };

    // Handle URL that launched the app (cold start)
    void Linking.getInitialURL().then((url) => {
      if (url) {
        void handleUrl(url);
      }
    });

    // Handle URLs received while app is running (warm start)
    const onUrl = ({ url }: { url: string }) => {
      void handleUrl(url);
    };
    // eslint-disable-next-line react-web-api/no-leaked-event-listener
    const subscription = Linking.addEventListener('url', onUrl);
    return () => subscription.remove();
  }, [router]);
}

function useGlobalNotificationPresentation() {
  useEffect(() => {
    try {
      const Notifications = require('expo-notifications') as ExpoNotificationsModule;

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      if (Platform.OS === 'android') {
        void Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: colors.brand.blue,
          sound: 'default',
        });
      }
    }
    catch {
      // expo-notifications may be unavailable in some development binaries.
    }
  }, []);
}

function RootLayout() {
  const [isAppReady, setIsAppReady] = React.useState(false);
  useDeepLinkHandler();
  useGlobalNotificationPresentation();

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      SplashScreen.setOptions({
        duration: 500,
        fade: true,
      });

      try {
        hydrateAuth();
      }
      catch {
        // no-op
      }
      finally {
        if (isMounted) {
          setIsAppReady(true);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const onLayoutRootView = React.useCallback(() => {
    if (isAppReady) {
      void SplashScreen.hideAsync().catch(() => { });
    }
  }, [isAppReady]);

  if (!isAppReady) {
    return null;
  }

  return (
    <Providers onLayout={onLayoutRootView}>
      <Stack screenOptions={{ headerShown: false }} />
    </Providers>
  );
}

// Wrap with Sentry's error instrumentation when a DSN is configured;
// otherwise withSentry returns RootLayout unchanged (fully inert).
const RootLayoutWithSentry = withSentry(RootLayout);

export default RootLayoutWithSentry;

function Providers({
  children,
  onLayout,
}: {
  children: React.ReactNode;
  onLayout?: () => void;
}) {
  return (
    <AppThemeProvider>
      <ThemedRoot onLayout={onLayout}>{children}</ThemedRoot>
    </AppThemeProvider>
  );
}

// ThemedRoot consumes useTheme() (only reachable below <AppThemeProvider>) and
// writes `data-theme` / `data-locale` onto the root view via React Native's
// dataSet API. CSS attribute selectors in `global.css` (`[data-locale="ar"]`)
// match these attributes through uniwind / react-native-css-interop.
function ThemedRoot({
  children,
  onLayout,
}: {
  children: React.ReactNode;
  onLayout?: () => void;
}) {
  const navTheme = useThemeConfig();
  const { resolvedMode, locale } = useTheme();

  // GestureHandlerRootView's ambient typing does not declare `dataSet`, but the
  // underlying View accepts it. Spread via an `unknown` cast to keep the type
  // boundary explicit. CSS attribute selectors `[data-theme="..."]` and
  // `[data-locale="..."]` in global.css read these attributes through uniwind /
  // react-native-css-interop.
  const rootDataSet = { dataSet: { theme: resolvedMode, locale } } as unknown as Record<string, unknown>;

  return (
    <GestureHandlerRootView
      onLayout={onLayout}
      style={styles.container}
      // eslint-disable-next-line better-tailwindcss/no-unknown-classes
      className={navTheme.dark ? `dark` : undefined}
      {...rootDataSet}
    >
      <KeyboardProvider>
        <ThemeProvider value={navTheme}>
          <APIProvider>
            <BottomSheetModalProvider>
              {/* Single root-owned ToastHost (T041 / US7). Screens dispatch
                  via useToast(); never own local toast timers. */}
              <ToastHost placement="top">
                {children}
              </ToastHost>
              <FlashMessage position="top" />
              <ConnectivityBanner />
            </BottomSheetModalProvider>
          </APIProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
