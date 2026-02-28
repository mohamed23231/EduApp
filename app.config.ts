import type { ConfigContext, ExpoConfig } from '@expo/config';

import type { AppIconBadgeConfig } from 'app-icon-badge/types';

import 'tsx/cjs';

// adding lint exception as we need to import tsx/cjs before env.ts is imported
// eslint-disable-next-line perfectionist/sort-imports
import Env from './env';

const EXPO_ACCOUNT_OWNER = process.env.EXPO_ACCOUNT_OWNER;
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID || 'a78173db-7bed-463b-9616-9a3ff01e3dc2';

const appIconBadgeConfig: AppIconBadgeConfig = {
  enabled: Env.EXPO_PUBLIC_APP_ENV !== 'production',
  badges: [
    {
      text: Env.EXPO_PUBLIC_APP_ENV,
      type: 'banner',
      color: 'white',
    },
    {
      text: Env.EXPO_PUBLIC_VERSION.toString(),
      type: 'ribbon',
      color: 'white',
    },
  ],
};

const associatedDomainHost = (() => {
  if (!Env.EXPO_PUBLIC_ASSOCIATED_DOMAIN) {
    return 'yourdomain.com';
  }
  try {
    return new URL(Env.EXPO_PUBLIC_ASSOCIATED_DOMAIN).host;
  }
  catch {
    return 'yourdomain.com';
  }
})();

function deriveIosUrlScheme(iosClientId?: string): string | undefined {
  if (!iosClientId) {
    return undefined;
  }

  const suffix = '.apps.googleusercontent.com';
  if (!iosClientId.endsWith(suffix)) {
    return undefined;
  }

  const clientIdPrefix = iosClientId.slice(0, -suffix.length);
  if (!clientIdPrefix) {
    return undefined;
  }

  return `com.googleusercontent.apps.${clientIdPrefix}`;
}

const iosGoogleUrlScheme
  = Env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME
    ?? deriveIosUrlScheme(Env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);

// eslint-disable-next-line max-lines-per-function
export default ({ config }: ConfigContext): ExpoConfig => {
  const googleSignInPlugin: [string, Record<string, string | undefined>] | null
    = iosGoogleUrlScheme
      ? [
          '@react-native-google-signin/google-signin',
          {
            iosClientId: Env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
            androidClientId: Env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
            webClientId: Env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
            iosUrlScheme: iosGoogleUrlScheme,
          },
        ]
      : null;

  const appConfig: ExpoConfig = {
    ...config,
    name: Env.EXPO_PUBLIC_NAME,
    description: `${Env.EXPO_PUBLIC_NAME} Mobile App`,
    scheme: Env.EXPO_PUBLIC_SCHEME,
    slug: 'privat-edu-mobile',
    version: Env.EXPO_PUBLIC_VERSION.toString(),
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    updates: {
      url: 'https://u.expo.dev/a78173db-7bed-463b-9616-9a3ff01e3dc2',
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: Env.EXPO_PUBLIC_BUNDLE_ID,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      associatedDomains: [
        `applinks:${associatedDomainHost}`,
      ],
    },
    experiments: {
      typedRoutes: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#2E3C4B',
      },
      package: Env.EXPO_PUBLIC_PACKAGE,
      intentFilters: [
        {
          action: 'android.intent.action.VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: associatedDomainHost,
              pathPrefix: '/reset-password',
            },
          ],
          category: [
            'android.intent.category.DEFAULT',
            'android.intent.category.BROWSABLE',
          ],
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      [
        'expo-splash-screen',
        {
          backgroundColor: '#2E3C4B',
          image: './assets/splash-icon.png',
          imageWidth: 150,
        },
      ],
      [
        'expo-font',
        {
          ios: {
            fonts: [
              'node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf',
              'node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf',
              'node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf',
              'node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf',
            ],
          },
          android: {
            fonts: [
              {
                fontFamily: 'Inter',
                fontDefinitions: [
                  {
                    path: 'node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf',
                    weight: 400,
                  },
                  {
                    path: 'node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf',
                    weight: 500,
                  },
                  {
                    path: 'node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf',
                    weight: 600,
                  },
                  {
                    path: 'node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf',
                    weight: 700,
                  },
                ],
              },
            ],
          },
        },
      ],
      'expo-localization',
      'expo-notifications',
      'expo-router',
      ...(googleSignInPlugin ? [googleSignInPlugin] : []),
      ['app-icon-badge', appIconBadgeConfig],
      ['react-native-edge-to-edge'],
      './plugins/with-quoted-react-native-xcode-script',
    ],
  };

  if (EXPO_ACCOUNT_OWNER) {
    appConfig.owner = EXPO_ACCOUNT_OWNER;
  }

  appConfig.extra = {
    ...appConfig.extra,
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  };

  return appConfig;
};
