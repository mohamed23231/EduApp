import * as React from 'react';

import { cleanup, render, screen, setup } from '@/lib/test-utils';

import { SegTabs } from './seg-tabs';

afterEach(cleanup);

describe('segTabs', () => {
  const tabs = ['All', 'Active', 'Done'] as const;

  it('renders all tabs', () => {
    render(<SegTabs tabs={tabs} active="All" onChange={jest.fn()} />);
    expect(screen.getByText('All')).toBeOnTheScreen();
    expect(screen.getByText('Active')).toBeOnTheScreen();
    expect(screen.getByText('Done')).toBeOnTheScreen();
  });

  it('calls onChange when a tab is pressed', async () => {
    const onChange = jest.fn();
    const { user } = setup(
      <SegTabs tabs={tabs} active="All" onChange={onChange} testID="seg-tabs" />,
    );
    await user.press(screen.getByText('Active'));
    expect(onChange).toHaveBeenCalledWith('Active');
  });

  it('marks the active tab as selected', () => {
    render(<SegTabs tabs={tabs} active="Active" onChange={jest.fn()} testID="seg-tabs" />);
    const activeTab = screen.getByTestId('seg-tabs-Active');
    expect(activeTab.props.accessibilityState.selected).toBe(true);

    const inactiveTab = screen.getByTestId('seg-tabs-All');
    expect(inactiveTab.props.accessibilityState.selected).toBe(false);
  });
});
