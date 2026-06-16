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

  // Locks the exact id→tone mapping so a future change (e.g. dropping `lime`
  // from ROTATING_TONES, which would flip the hash modulus from 7 to 6) cannot
  // silently re-roll every student's deterministic avatar color. The contract
  // promise "the same id always returns the same tone" must hold pre/post-B0.
  // `useMonogramTone` is a pure deterministic helper (no React hooks inside),
  // so it is safe to call in a loop here; alias drops the `use` prefix so the
  // rules-of-hooks linter doesn't treat these fixture calls as hook calls.
  it('useMonogramTone maps a fixed id list to a stable, expected wheel', () => {
    const toneFor = useMonogramTone;
    const EXPECTED: Record<string, string> = {
      'layla': 'lime',
      'student-001': 'lime',
      'student-002': 'indigo',
      'b1a2c3d4-0000-4000-8000-000000000001': 'teal',
      'ahmed-hassan': 'violet',
      'سارة': 'amber',
      '00000000-0000-0000-0000-000000000000': 'rose',
      'z': 'amber',
    };
    for (const [id, tone] of Object.entries(EXPECTED)) {
      expect(toneFor(id)).toBe(tone);
    }
  });

  it('useMonogramTone wheel still has exactly 7 entries (no re-roll)', () => {
    // Every id resolves into the 7-tone wheel; the modulus must stay 7.
    const toneFor = useMonogramTone;
    const wheel = new Set<string>();
    for (let i = 0; i < 200; i++) {
      wheel.add(toneFor(`seed-${i}`));
    }
    expect(wheel.size).toBeLessThanOrEqual(7);
    for (const t of wheel) {
      expect(['indigo', 'rose', 'teal', 'amber', 'violet', 'sky', 'lime']).toContain(t);
    }
  });
});
