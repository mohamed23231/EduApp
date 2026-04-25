import * as React from 'react';
import { Pressable, Text } from 'react-native';
import { Uniwind, useUniwind } from 'uniwind';

import { cleanup, render, screen, setup } from '@/lib/test-utils';

import { ThemeProvider, useTheme } from './theme';

jest.mock('uniwind', () => ({
  __esModule: true,
  Uniwind: { setTheme: jest.fn() },
  useUniwind: jest.fn(() => ({ theme: 'light', hasAdaptiveThemes: true })),
}));

const mockedUseUniwind = useUniwind as jest.Mock;
const mockedSetTheme = Uniwind.setTheme as jest.Mock;

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  mockedUseUniwind.mockReturnValue({ theme: 'light', hasAdaptiveThemes: true });
});

describe('themeProvider', () => {
  it('renders children', () => {
    render(
      <ThemeProvider>
        <Text testID="child">hello</Text>
      </ThemeProvider>,
    );
    expect(screen.getByTestId('child')).toBeOnTheScreen();
  });

  it('resolvedMode follows uniwind when user picks system', () => {
    mockedUseUniwind.mockReturnValue({ theme: 'dark', hasAdaptiveThemes: true });

    function Consumer() {
      const { mode, resolvedMode, isDark } = useTheme();
      return (
        <>
          <Text testID="mode">{mode}</Text>
          <Text testID="resolved">{resolvedMode}</Text>
          <Text testID="isDark">{String(isDark)}</Text>
        </>
      );
    }

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    // Default user-chosen mode is 'system' (no MMKV value); resolvedMode collapses
    // to the OS-reported uniwind value.
    expect(screen.getByTestId('mode').props.children).toBe('system');
    expect(screen.getByTestId('resolved').props.children).toBe('dark');
    expect(screen.getByTestId('isDark').props.children).toBe('true');
  });

  it('setMode persists the user choice and forwards to Uniwind.setTheme', async () => {
    function Consumer() {
      const { setMode } = useTheme();
      return <Pressable testID="btn" onPress={() => setMode('dark')} />;
    }

    const { user } = setup(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    await user.press(screen.getByTestId('btn'));
    expect(mockedSetTheme).toHaveBeenCalledWith('dark');
  });

  it('useTheme throws when used outside ThemeProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    function Bad() {
      useTheme();
      return null;
    }

    expect(() => render(<Bad />)).toThrow('useTheme must be used within a ThemeProvider');
    consoleError.mockRestore();
  });

  it('child does not remount when the resolved mode changes', () => {
    let currentTheme: 'light' | 'dark' = 'light';
    mockedUseUniwind.mockImplementation(() => ({
      theme: currentTheme,
      hasAdaptiveThemes: true,
    }));

    const mountSymbols: symbol[] = [];

    function Consumer() {
      const mountId = React.useRef<symbol>(Symbol('mount')).current;
      React.useLayoutEffect(() => {
        mountSymbols.push(mountId);
      });
      const { resolvedMode } = useTheme();
      return <Text testID="resolved">{resolvedMode}</Text>;
    }

    const { rerender } = render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('resolved').props.children).toBe('light');
    const symbolAfterMount = mountSymbols[0];

    currentTheme = 'dark';
    rerender(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('resolved').props.children).toBe('dark');
    expect(mountSymbols.length).toBeGreaterThan(1);
    expect(mountSymbols.every(s => s === symbolAfterMount)).toBe(true);
  });
});
