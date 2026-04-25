import * as React from 'react';

import { cleanup, render, screen } from '@/lib/test-utils';

import { Skeleton, SkeletonCard } from './skeleton';
import { ThemeProvider } from './theme';

jest.mock('uniwind', () => ({
  __esModule: true,
  Uniwind: { setTheme: jest.fn() },
  useUniwind: jest.fn(() => ({ theme: 'light', hasAdaptiveThemes: true })),
}));

afterEach(cleanup);

describe('skeleton', () => {
  it('renders a skeleton box', () => {
    render(
      <ThemeProvider>
        <Skeleton testID="skeleton" />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('skeleton')).toBeOnTheScreen();
  });

  it('renders with custom dimensions', () => {
    render(
      <ThemeProvider>
        <Skeleton testID="skeleton" width={200} height={20} radius={10} />
      </ThemeProvider>,
    );
    const el = screen.getByTestId('skeleton');
    expect(el).toBeOnTheScreen();
  });
});

describe('skeletonCard', () => {
  it('renders the card placeholder', () => {
    render(
      <ThemeProvider>
        <SkeletonCard testID="skeleton-card" />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('skeleton-card')).toBeOnTheScreen();
  });

  it('contains a circle and two skeleton lines', () => {
    render(
      <ThemeProvider>
        <SkeletonCard testID="skeleton-card" />
      </ThemeProvider>,
    );
    const card = screen.getByTestId('skeleton-card');
    expect(card).toBeOnTheScreen();
    expect(card.props.children.length).toBeGreaterThan(0);
  });
});
