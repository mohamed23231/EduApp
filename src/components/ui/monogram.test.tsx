import * as React from 'react';
import { cleanup, render, screen } from '@/lib/test-utils';
import { Monogram, useMonogramTone } from './monogram';

afterEach(cleanup);

describe('monogram', () => {
  it('renders with default props and testID', () => {
    render(<Monogram name="Ahmed Ali" testID="monogram" />);
    expect(screen.getByTestId('monogram')).toBeOnTheScreen();
  });

  it('derives initials from first two words', () => {
    render(<Monogram name="Sara Khalid" testID="monogram" />);
    const el = screen.getByTestId('monogram');
    const text = el.props.children;
    expect(text.props.children).toBe('SK');
  });

  it('renders with accessibilityLabel', () => {
    render(<Monogram name="Omar" testID="monogram" accessibilityLabel="User avatar" />);
    expect(screen.getByTestId('monogram').props.accessibilityLabel).toBe('User avatar');
  });

  it('renders with different tones', () => {
    const { rerender } = render(<Monogram name="Test" tone="rose" testID="monogram" />);
    expect(screen.getByTestId('monogram')).toBeOnTheScreen();

    rerender(<Monogram name="Test" tone="present" testID="monogram" />);
    expect(screen.getByTestId('monogram')).toBeOnTheScreen();
  });

  it('applies ring border when ring is true', () => {
    render(<Monogram name="Test" ring testID="monogram" />);
    const el = screen.getByTestId('monogram');
    expect(el.props.style.borderWidth).toBe(2);
  });

  it('applies square radius when square is true', () => {
    render(<Monogram name="Test" square testID="monogram" />);
    const el = screen.getByTestId('monogram');
    expect(el.props.style.borderRadius).toBe(12);
  });

  it('useMonogramTone returns deterministic tone', () => {
    const tone1 = useMonogramTone('user-123');
    const tone2 = useMonogramTone('user-123');
    expect(tone1).toBe(tone2);
  });

  it('useMonogramTone only returns rotating tones', () => {
    const tone = useMonogramTone('some-id');
    expect(['indigo', 'rose', 'teal', 'amber', 'violet', 'sky', 'lime']).toContain(tone);
  });
});
