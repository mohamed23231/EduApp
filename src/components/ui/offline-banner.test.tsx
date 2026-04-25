import * as React from 'react';

import { cleanup, render, screen } from '@/lib/test-utils';

import { OfflineBanner } from './offline-banner';

afterEach(cleanup);

describe('offlineBanner', () => {
  it('renders when visible is true', () => {
    render(<OfflineBanner visible={true} testID="offline-banner" />);
    expect(screen.getByTestId('offline-banner')).toBeOnTheScreen();
    expect(screen.getByText('You\'re offline')).toBeOnTheScreen();
  });

  it('renders null when visible is false', () => {
    render(<OfflineBanner visible={false} testID="offline-banner" />);
    expect(screen.queryByTestId('offline-banner')).toBeNull();
  });
});
