import * as React from 'react';
import { AccessibilityInfo } from 'react-native';
import { Uniwind, useUniwind } from 'uniwind';
import i18n from '@/lib/i18n';
import { storage } from '@/lib/storage';

// ======================== Types ========================

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  /** User-chosen mode. May be `'system'`. Persisted to MMKV. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Resolved (`'light' | 'dark'`) — `'system'` collapses to current OS value. */
  resolvedMode: 'light' | 'dark';
  /** Convenience boolean derived from `resolvedMode`. */
  isDark: boolean;
  /** Current i18n locale. Updates when the user switches language at runtime. */
  locale: string;
  reducedMotion: boolean;
};

// MMKV keys
const THEME_STORAGE_KEY = 'app.theme.mode';
const LEGACY_THEME_KEY = 'SELECTED_THEME';

// ======================== Migration ========================

// One-shot migration from the pre-redesign theme key. Runs at module load so
// `<ThemeProvider>` initializer reads the migrated value on first render.
function migrateLegacyThemeKey(): void {
  if (storage.getString(THEME_STORAGE_KEY) !== undefined)
    return;
  const legacy = storage.getString(LEGACY_THEME_KEY);
  if (legacy === 'light' || legacy === 'dark' || legacy === 'system') {
    storage.set(THEME_STORAGE_KEY, legacy);
  }
  if (legacy !== undefined) {
    storage.remove(LEGACY_THEME_KEY);
  }
}

migrateLegacyThemeKey();

// ======================== Hooks ========================

function useI18nLocale(): string {
  const [locale, setLocale] = React.useState<string>(() => i18n.language ?? 'en');
  React.useEffect(() => {
    const handler = (lng: string) => setLocale(lng);
    i18n.on('languageChanged', handler);
    return () => {
      i18n.off('languageChanged', handler);
    };
  }, []);
  return locale;
}

// ======================== Provider ========================

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: React.ReactNode;
};

function readPersistedMode(): ThemeMode {
  const stored = storage.getString(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system')
    return stored;
  return 'system';
}

function resolveActiveMode(mode: ThemeMode, uniwindTheme: string | undefined): 'light' | 'dark' {
  if (mode === 'light')
    return 'light';
  if (mode === 'dark')
    return 'dark';
  return uniwindTheme === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme: uniwindTheme } = useUniwind();
  const locale = useI18nLocale();
  const [mode, setModeState] = React.useState<ThemeMode>(readPersistedMode);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (val) => {
      if (mounted)
        setReducedMotion(val);
    });

    AccessibilityInfo.isReduceMotionEnabled().then((val) => {
      if (mounted)
        setReducedMotion(val);
    }).catch(() => {});

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const setMode = React.useCallback((next: ThemeMode) => {
    setModeState(next);
    storage.set(THEME_STORAGE_KEY, next);
    Uniwind.setTheme(next);
  }, []);

  // Apply persisted mode to uniwind on mount and whenever `mode` changes.
  React.useEffect(() => {
    Uniwind.setTheme(mode);
  }, [mode]);

  const resolvedMode = resolveActiveMode(mode, uniwindTheme);
  const isDark = resolvedMode === 'dark';

  const value = React.useMemo<ThemeContextValue>(
    () => ({ mode, setMode, resolvedMode, isDark, locale, reducedMotion }),
    [mode, setMode, resolvedMode, isDark, locale, reducedMotion],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

// ======================== Public Hooks ========================

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = React.use(ThemeContext);
  if (ctx === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useReducedMotion(): boolean {
  return useTheme().reducedMotion;
}

// ======================== Layout Helpers ========================

// Module-level constants — not theme-context state. Documented in
// specs/002-ui-redesign/contracts/theme-tokens.md.

export const LAYOUT = {
  maxPhoneWidth: 480,
  baseScreenWidth: 390,
  scaleToBase: (width: number) => Math.min(width, 390) / 390,
} as const;

export const MOTION = {
  durations: {
    instant: 0,
    fast: 150,
    base: 250,
    slow: 600,
    logoIntro: 1400,
  },
  easings: {
    standard: [0.2, 0.7, 0.2, 1] as [number, number, number, number],
    accelerate: [0.4, 0.0, 1, 1] as [number, number, number, number],
    decelerate: [0.0, 0.0, 0.2, 1] as [number, number, number, number],
    emphasized: [0.2, 0.9, 0.3, 1] as [number, number, number, number],
  },
} as const;

export const Z_INDEX = {
  base: 0,
  raised: 10,
  sticky: 20,
  navigation: 30,
  tabBar: 40,
  toast: 50,
  offlineBanner: 100,
  sheet: 180,
  confirmSheet: 200,
  modal: 300,
} as const;
