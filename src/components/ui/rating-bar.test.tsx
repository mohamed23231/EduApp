import * as React from 'react';
import { cleanup, render, screen } from '@/lib/test-utils';
import { RatingBar } from './rating-bar';
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

describe('ratingBar', () => {
  it('renders with default props and testID', () => {
    render(wrap(<RatingBar value={7} testID="rating-bar" />));
    expect(screen.getByTestId('rating-bar')).toBeOnTheScreen();
  });

  it('sets accessibility progressbar role', () => {
    render(wrap(<RatingBar value={7} max={10} testID="rating-bar" />));
    const el = screen.getByTestId('rating-bar');
    expect(el.props.accessibilityRole).toBe('progressbar');
    expect(el.props.accessibilityValue).toEqual({ min: 0, max: 10, now: 7 });
  });

  it('renders with custom height and color', () => {
    render(wrap(<RatingBar value={5} height={12} color="#FF0000" testID="rating-bar" />));
    expect(screen.getByTestId('rating-bar')).toBeOnTheScreen();
  });

  it('renders with accessibilityLabel', () => {
    render(wrap(<RatingBar value={3} testID="rating-bar" accessibilityLabel="Attendance" />));
    expect(screen.getByTestId('rating-bar').props.accessibilityLabel).toBe('Attendance');
  });
});
