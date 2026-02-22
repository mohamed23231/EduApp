import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
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
void SplashScreen.preventAutoHideAsync().catch(() => {});

// eslint-disable-next-line react-refresh/only-export-components
export const unstable_settings = {
  initialRouteName: 'login',
};

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = React.useState(false);

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
      void SplashScreen.hideAsync().catch(() => {});
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
