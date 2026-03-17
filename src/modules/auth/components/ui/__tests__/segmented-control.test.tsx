import * as React from 'react';

import { cleanup, render, screen, setup } from '@/lib/test-utils';

import { SegmentedControl } from '../segmented-control';

afterEach(cleanup);

const segments = ['Login', 'Sign Up'];

describe('segmentedControl', () => {
  it('should render all segment labels', () => {
    render(
      <SegmentedControl segments={segments} activeIndex={0} onChange={jest.fn()} />,
    );
    expect(screen.getByText('Login')).toBeOnTheScreen();
    expect(screen.getByText('Sign Up')).toBeOnTheScreen();
  });

  it('should call onChange(0) when first segment is pressed', async () => {
    const onChange = jest.fn();
    const { user } = setup(
      <SegmentedControl segments={segments} activeIndex={1} onChange={onChange} />,
    );
    await user.press(screen.getByText('Login'));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('should call onChange(1) when second segment is pressed', async () => {
    const onChange = jest.fn();
    const { user } = setup(
      <SegmentedControl segments={segments} activeIndex={0} onChange={onChange} />,
    );
    await user.press(screen.getByText('Sign Up'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('should apply font-bold class to active segment label', () => {
    render(
      <SegmentedControl segments={segments} activeIndex={0} onChange={jest.fn()} />,
    );
    const activeLabel = screen.getByText('Login');
    expect(activeLabel.props.className).toContain('font-bold');
  });

  it('should NOT apply font-bold class to inactive segment label', () => {
    render(
      <SegmentedControl segments={segments} activeIndex={0} onChange={jest.fn()} />,
    );
    const inactiveLabel = screen.getByText('Sign Up');
    expect(inactiveLabel.props.className).not.toContain('font-bold');
  });

  it('should render three segments correctly', () => {
    const threeSegments = ['Tab A', 'Tab B', 'Tab C'];
    render(
      <SegmentedControl segments={threeSegments} activeIndex={1} onChange={jest.fn()} />,
    );
    expect(screen.getByText('Tab A')).toBeOnTheScreen();
    expect(screen.getByText('Tab B')).toBeOnTheScreen();
    expect(screen.getByText('Tab C')).toBeOnTheScreen();
  });

  it('should apply font-bold to second segment when activeIndex is 1', () => {
    render(
      <SegmentedControl segments={segments} activeIndex={1} onChange={jest.fn()} />,
    );
    expect(screen.getByText('Sign Up').props.className).toContain('font-bold');
    expect(screen.getByText('Login').props.className).not.toContain('font-bold');
  });
});
