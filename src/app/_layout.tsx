import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { ThemeProvider } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useThemeConfig } from '@/components/ui/use-theme-config';
import { hydrateAuth } from '@/features/auth/use-auth-store';
import { APIProvider } from '@/lib/api';
import { loadSelectedTheme } from '@/lib/hooks/use-selected-theme';
import '@/lib/i18n';
// Import  global CSS file
import '../global.css';

export { ErrorBoundary } from 'expo-router';

// Keep splash visible until bootstrap completes.
void SplashScreen.preventAutoHideAsync().catch(() => { });

// eslint-disable-next-line react-refresh/only-export-components
export const unstable_settings = {
  initialRouteName: 'login',
};

/**
 * Deep-link handler for password reset URLs.
 * Listens for Universal Links (iOS) and App Links (Android) matching /reset-password.
 * Extracts token params and navigates to the reset-password screen.
 * Requirements: 7.1, 7.2, 11.2
 */
function useDeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = (url: string) => {
      const parsed = Linking.parse(url);
      if (parsed.path === 'reset-password' || parsed.path === '/reset-password') {
        const params = parsed.queryParams ?? {};
        const code = typeof params.code === 'string' ? params.code : undefined;
        const accessToken = typeof params.access_token === 'string' ? params.access_token : undefined;
        const refreshToken = typeof params.refresh_token === 'string' ? params.refresh_token : undefined;

        if (code) {
          router.push({ pathname: '/reset-password' as any, params: { code } });
        }
        else if (accessToken && refreshToken) {
          router.push({ pathname: '/reset-password' as any, params: { access_token: accessToken, refresh_token: refreshToken } });
        }
      }
    };

    // Handle URL that launched the app (cold start)
    void Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      }
    });

    // Handle URLs received while app is running (warm start)
    const onUrl = ({ url }: { url: string }) => handleUrl(url);
    const subscription = Linking.addEventListener('url', onUrl);
    return () => subscription.remove();
  }, [router]);
}

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = React.useState(false);
  useDeepLinkHandler();

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      SplashScreen.setOptions({
        duration: 500,
        fade: true,
      });

      try {
        loadSelectedTheme();
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

function Providers({
  children,
  onLayout,
}: {
  children: React.ReactNode;
  onLayout?: () => void;
}) {
  const theme = useThemeConfig();
  return (
    <GestureHandlerRootView
      onLayout={onLayout}
      style={styles.container}
      // eslint-disable-next-line better-tailwindcss/no-unknown-classes
      className={theme.dark ? `dark` : undefined}
    >
      <KeyboardProvider>
        <ThemeProvider value={theme}>
          <APIProvider>
            <BottomSheetModalProvider>
              {children}
              <FlashMessage position="top" />
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
