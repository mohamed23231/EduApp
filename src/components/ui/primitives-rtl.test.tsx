import { describe, expect, it } from '@jest/globals';
import * as React from 'react';
import { Dot } from '@/components/ui/dot';

import { Hairline } from '@/components/ui/hairline';
import { Icon } from '@/components/ui/icon';
import { PressButton } from '@/components/ui/press-button';
import { StatusChip } from '@/components/ui/status-chip';
import { TabaMark } from '@/components/ui/taba-mark';
import { TabaWordmark } from '@/components/ui/taba-wordmark';
import { render, screen } from '@/lib/test-utils';

describe('UI primitives render without crashing', () => {
  it('StatusChip renders', () => {
    render(<StatusChip status="present" />);
    expect(screen.UNSAFE_getAllByType(StatusChip)).toHaveLength(1);
  });

  it('StatusChip with all tones', () => {
    const tones: Array<Parameters<typeof StatusChip>[0]['status']> = [
      'present',
      'absent',
      'excused',
      'pending',
      'live',
      'closed',
      'draft',
    ];
    for (const tone of tones) {
      render(<StatusChip status={tone} />);
    }
  });

  it('Dot renders', () => {
    render(<Dot />);
    expect(screen.UNSAFE_getAllByType(Dot)).toHaveLength(1);
  });

  it('Hairline renders', () => {
    render(<Hairline />);
    expect(screen.UNSAFE_getAllByType(Hairline)).toHaveLength(1);
  });

  it('Icon renders', () => {
    render(<Icon name="checkmark" />);
    expect(screen.UNSAFE_getAllByType(Icon)).toHaveLength(1);
  });

  it('PressButton renders', () => {
    render(<PressButton />);
  });

  it('TabaMark renders with defaults', () => {
    render(<TabaMark />);
    expect(screen.UNSAFE_getAllByType(TabaMark)).toHaveLength(1);
  });

  it('TabaMark renders with boxed frame', () => {
    render(<TabaMark size={64} frame="ink" boxed testID="mark" />);
    expect(screen.getByTestId('mark')).toBeTruthy();
  });

  it('TabaWordmark renders plain', () => {
    render(<TabaWordmark />);
    expect(screen.UNSAFE_getAllByType(TabaWordmark)).toHaveLength(1);
  });

  it('TabaWordmark renders with gradient three', () => {
    render(<TabaWordmark gradientThree />);
    expect(screen.UNSAFE_getAllByType(TabaWordmark)).toHaveLength(1);
  });
});
