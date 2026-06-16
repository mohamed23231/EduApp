/* eslint-disable ts/ban-ts-comment */
/* eslint-disable no-restricted-globals */

// Mock react-native-worklets first
jest.mock('react-native-worklets', () => ({
  __esModule: true,
  default: {},
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  const createEnteringAnimation = () => {
    const chain: {
      delay: jest.Mock;
      duration: jest.Mock;
      springify: jest.Mock;
      damping: jest.Mock;
    } = {
      delay: jest.fn(() => chain),
      duration: jest.fn(() => chain),
      springify: jest.fn(() => chain),
      damping: jest.fn(() => chain),
    };
    return chain;
  };

  return {
    __esModule: true,
    default: {
      View,
      ScrollView: View,
      createAnimatedComponent: (component: any) => component,
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(fn => fn()),
    useAnimatedProps: jest.fn(fn => fn()),
    withTiming: jest.fn(value => value),
    withSpring: jest.fn(value => value),
    withDecay: jest.fn(value => value),
    withDelay: jest.fn((_, value) => value),
    withRepeat: jest.fn(value => value),
    withSequence: jest.fn((...values) => values[0]),
    cancelAnimation: jest.fn(),
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      quad: jest.fn(),
      cubic: jest.fn(),
      bezier: jest.fn(),
      in: jest.fn(fn => fn),
      out: jest.fn(fn => fn),
      inOut: jest.fn(fn => fn),
    },
    FadeIn: createEnteringAnimation(),
    FadeOut: createEnteringAnimation(),
    FadeInDown: createEnteringAnimation(),
    FadeInUp: createEnteringAnimation(),
    FadeInLeft: createEnteringAnimation(),
    FadeInRight: createEnteringAnimation(),
    SlideInDown: createEnteringAnimation(),
    SlideInUp: createEnteringAnimation(),
    SlideInLeft: createEnteringAnimation(),
    SlideInRight: createEnteringAnimation(),
    Layout: {},
    Keyframe: jest.fn(),
  };
});

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    navigate: jest.fn(),
    canGoBack: jest.fn(() => true),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => '/'),
  useSegments: jest.fn(() => []),
}));

// Mock expo-localization
jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [
    {
      languageTag: 'en-US',
      languageCode: 'en',
      textDirection: 'ltr',
      digitGroupingSeparator: ',',
      decimalSeparator: '.',
      measurementSystem: 'metric',
      currencyCode: 'USD',
      currencySymbol: '$',
      regionCode: 'US',
    },
  ]),
}));

// Mock react-native-mmkv
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
    getAllKeys: jest.fn(() => []),
  })),
  useMMKVString: jest.fn((_key: string) => [undefined, jest.fn()]),
  useMMKVNumber: jest.fn((_key: string) => [undefined, jest.fn()]),
  useMMKVBoolean: jest.fn((_key: string) => [undefined, jest.fn()]),
  useMMKVObject: jest.fn((_key: string) => [undefined, jest.fn()]),
  createMMKV: jest.fn(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
    getAllKeys: jest.fn(() => []),
  })),
}));

// Global window object setup for React Native testing
// @ts-expect-error
global.window = {};

// @ts-expect-error
global.window = global;

// Mock i18next
jest.mock('i18next', () => {
  const i18nMock: any = {
    t: jest.fn((key: string) => key),
    language: 'en',
    languages: ['en', 'ar'],
    changeLanguage: jest.fn(),
    dir: jest.fn(() => 'ltr'),
    on: jest.fn(),
    off: jest.fn(),
  };
  i18nMock.use = jest.fn(() => i18nMock);
  i18nMock.init = jest.fn(() => i18nMock);
  return {
    __esModule: true,
    default: i18nMock,
    ...i18nMock,
  };
});

// Mock react-native-safe-area-context — provide stub insets/frame so primitives
// that read useSafeAreaInsets() / useSafeAreaFrame() (e.g. Sheet, ConfirmSheet,
// TopBar) render in tests without a real SafeAreaProvider wrapper.
jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: RN.View,
    SafeAreaInsetsContext: { Consumer: ({ children }: { children: (i: typeof insets) => React.ReactNode }) => children(insets) },
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: { insets, frame },
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  })),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
    use: jest.fn(function () { return this; }),
  },
}));

// Mock @react-native-community/netinfo (native module — unavailable in jest)
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
  },
  useNetInfo: jest.fn(() => ({ isConnected: true })),
}));
