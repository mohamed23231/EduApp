import type { StatusChipStatus } from './status-chip';
import * as React from 'react';

import { View } from 'react-native';

import { cleanup, render, screen } from '@/lib/test-utils';
import { StatusChip } from './status-chip';

afterEach(cleanup);

const ALL_STATUSES: StatusChipStatus[] = [
  'present',
  'absent',
  'excused',
  'pending',
  'live',
  'closed',
  'draft',
];

describe('statusChip', () => {
  it('renders without crashing', () => {
    render(<StatusChip status="present" testID="chip" />);
    const chips = screen.UNSAFE_queryAllByType(View);
    expect(chips.length).toBeGreaterThan(0);
  });

  it('renders all statuses', () => {
    for (const status of ALL_STATUSES) {
      const { unmount } = render(<StatusChip status={status} testID="chip" />);
      const chips = screen.UNSAFE_queryAllByType(View);
      expect(chips.length).toBeGreaterThan(0);
      unmount();
    }
  });

  it('renders in compact mode', () => {
    render(<StatusChip status="absent" compact testID="chip" />);
    const chips = screen.UNSAFE_queryAllByType(View);
    expect(chips.length).toBeGreaterThan(0);
  });

  it('renders in dark mode', () => {
    render(<StatusChip status="present" dark testID="chip" />);
    const chips = screen.UNSAFE_queryAllByType(View);
    expect(chips.length).toBeGreaterThan(0);
  });

  it('renders live status with pulsing dot', () => {
    render(<StatusChip status="live" testID="chip" />);
    expect(screen.getByText('status.live')).toBeOnTheScreen();
  });

  it('displays status text from translation key', () => {
    render(<StatusChip status="absent" testID="chip" />);
    expect(screen.getByText('status.absent')).toBeOnTheScreen();
  });
});
