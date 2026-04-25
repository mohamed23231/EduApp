import * as React from 'react';
import { View } from 'react-native';

import { cleanup, render, screen } from '@/lib/test-utils';

import { Dot } from './dot';

afterEach(cleanup);

describe('dot', () => {
  it('renders without crashing', () => {
    render(<Dot testID="dot" />);
    const dots = screen.UNSAFE_queryAllByType(View);
    expect(dots.length).toBeGreaterThan(0);
  });

  it('renders with custom size and color', () => {
    render(<Dot testID="dot" size={10} color="#FF0000" />);
    const dots = screen.UNSAFE_queryAllByType(View);
    expect(dots.length).toBeGreaterThan(0);
  });

  it('renders with pulse enabled', () => {
    render(<Dot testID="dot" pulse />);
    const dots = screen.UNSAFE_queryAllByType(View);
    expect(dots.length).toBeGreaterThan(0);
  });

  it('has accessibility elements hidden', () => {
    render(<Dot testID="dot" />);
    const outerView = screen.UNSAFE_queryAllByType(View)[0];
    expect(outerView.props.accessibilityElementsHidden).toBe(true);
    expect(outerView.props.importantForAccessibility).toBe('no-hide-descendants');
  });

  it('uses default values when no props provided', () => {
    render(<Dot testID="dot" />);
    const dots = screen.UNSAFE_queryAllByType(View);
    expect(dots.length).toBeGreaterThan(0);
  });
});
