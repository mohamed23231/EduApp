import * as React from 'react';
import { cleanup, render, screen } from '@/lib/test-utils';
import { BigNumber } from './big-number';
import { ThemeProvider } from './theme';

jest.mock('uniwind', () => ({
  __esModule: true,
  Uniwind: { setTheme: jest.fn() },
  useUniwind: jest.fn(() => ({ theme: 'light', hasAdaptiveThemes: true })),
}));

afterEach(cleanup);

function wrap(ui: React.ReactElement) {
  return <ThemeProvider>{ui}</ThemeProvider>;
}

describe('bigNumber', () => {
  it('renders with default props and testID', () => {
    render(wrap(<BigNumber value={42} testID="big-number" />));
    expect(screen.getByTestId('big-number')).toBeOnTheScreen();
  });

  it('renders string value', () => {
    render(wrap(<BigNumber value="99" testID="big-number" />));
    expect(screen.getByTestId('big-number')).toBeOnTheScreen();
  });

  it('renders with suffix', () => {
    render(wrap(<BigNumber value={85} suffix="%" testID="big-number" />));
    const el = screen.getByTestId('big-number');
    expect(el.props.accessibilityLabel).toBe('85%');
  });

  it('renders with accessibilityLabel', () => {
    render(wrap(<BigNumber value={10} testID="big-number" accessibilityLabel="Score" />));
    expect(screen.getByTestId('big-number').props.accessibilityLabel).toBe('Score');
  });

  it('applies custom size and color', () => {
    render(wrap(<BigNumber value={5} size={48} testID="big-number" />));
    expect(screen.getByTestId('big-number')).toBeOnTheScreen();
  });
});
