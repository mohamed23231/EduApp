import * as React from 'react';

import { cleanup, render, screen, setup } from '@/lib/test-utils';

import { EmptyState } from './empty-state';

afterEach(cleanup);

describe('emptyState', () => {
  it('renders with a scope', () => {
    render(<EmptyState testID="empty" scope="teacherNoSessions" />);
    expect(screen.getByTestId('empty')).toBeOnTheScreen();
    // Scope defaults now resolve through i18n keys; the test t() mock echoes the key.
    expect(screen.getByText('emptyState.teacherNoSessions_title')).toBeOnTheScreen();
  });

  it('renders with generic scope by default', () => {
    render(<EmptyState testID="empty" />);
    expect(screen.getByText('emptyState.generic_title')).toBeOnTheScreen();
  });

  it('renders custom title and body', () => {
    render(
      <EmptyState testID="empty" title="Custom Title" body="Custom body text" />,
    );
    expect(screen.getByText('Custom Title')).toBeOnTheScreen();
    expect(screen.getByText('Custom body text')).toBeOnTheScreen();
  });

  it('renders action button and handles press', async () => {
    const onPress = jest.fn();
    const { user } = setup(
      <EmptyState
        testID="empty"
        action={{ label: 'Add Session', onPress }}
      />,
    );
    expect(screen.getByText('Add Session')).toBeOnTheScreen();
    await user.press(screen.getByTestId('empty-action'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not render action when not provided', () => {
    render(<EmptyState testID="empty" />);
    expect(screen.queryByTestId('empty-action')).toBeNull();
  });
});
