import * as React from 'react';

import { cleanup, render, screen, setup } from '@/lib/test-utils';

import { ErrorState } from './error-state';

afterEach(cleanup);

describe('errorState', () => {
  it('renders with default title', () => {
    render(<ErrorState testID="error" />);
    expect(screen.getByText('common.errorTitle')).toBeOnTheScreen();
  });

  it('renders with custom title and body', () => {
    render(
      <ErrorState
        testID="error"
        title="Network error"
        body="Please check your connection."
      />,
    );
    expect(screen.getByText('Network error')).toBeOnTheScreen();
    expect(screen.getByText('Please check your connection.')).toBeOnTheScreen();
  });

  it('renders action button and handles press', async () => {
    const onPress = jest.fn();
    const { user } = setup(
      <ErrorState
        testID="error"
        action={{ label: 'Retry', onPress }}
      />,
    );
    expect(screen.getByText('Retry')).toBeOnTheScreen();
    await user.press(screen.getByTestId('error-action'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not render body when not provided', () => {
    render(<ErrorState testID="error" />);
    expect(screen.getByTestId('error')).toBeOnTheScreen();
    expect(screen.getByText('common.errorTitle')).toBeOnTheScreen();
  });
});
