import * as React from 'react';

import { cleanup, render, screen, setup } from '@/lib/test-utils';

import { SectionLabel } from './section-label';

afterEach(cleanup);

describe('sectionLabel', () => {
  it('renders label text', () => {
    render(<SectionLabel testID="section">Attendance</SectionLabel>);
    expect(screen.getByText('Attendance')).toBeOnTheScreen();
  });

  it('renders action button and calls onPress', async () => {
    const onPress = jest.fn();
    const { user } = setup(
      <SectionLabel action={{ label: 'See All', onPress }}>Students</SectionLabel>,
    );
    expect(screen.getByText('Students')).toBeOnTheScreen();
    expect(screen.getByText('See All')).toBeOnTheScreen();

    await user.press(screen.getByText('See All'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
