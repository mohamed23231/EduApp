import type { Theme } from '@react-navigation/native';
import {
  DarkTheme as _DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import { useUniwind } from 'uniwind';

import colors from '@/components/ui/colors';

const LightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.brand.primary,
    background: colors.neutral.paper,
    card: colors.neutral.card,
    text: colors.neutral.ink,
    border: colors.neutral.rule,
    notification: colors.brand.primary,
  },
};

const DarkTheme: Theme = {
  ..._DarkTheme,
  colors: {
    ..._DarkTheme.colors,
    primary: colors.brand.primary,
    background: colors.neutral.ink,
    card: colors.neutral.bgElev,
    text: colors.neutral.dim,
    border: colors.neutral.ruleDark,
    notification: colors.brand.primary,
  },
};

export function useThemeConfig(): Theme {
  const { theme } = useUniwind();

  if (theme === 'dark') {
    return DarkTheme;
  }

  return LightTheme;
}
