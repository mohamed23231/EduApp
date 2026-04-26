import { describe, expect, it } from '@jest/globals';
import colors from '@/components/ui/colors';

import { TabaMark } from '@/components/ui/taba-mark';
import { TabaWordmark } from '@/components/ui/taba-wordmark';
import { render, screen } from '@/lib/test-utils';

describe('TabaMark', () => {
  it('renders with default size (48)', () => {
    render(<TabaMark testID="mark" />);
    const el = screen.getByTestId('mark');
    expect(el).toBeTruthy();
    expect(el.props.style).toEqual(
      expect.objectContaining({ width: 48, height: 48 }),
    );
  });

  it('renders with custom size', () => {
    render(<TabaMark size={64} testID="mark" />);
    const el = screen.getByTestId('mark');
    expect(el.props.style).toEqual(
      expect.objectContaining({ width: 64, height: 64 }),
    );
  });

  it('renders with ink frame', () => {
    render(<TabaMark frame="ink" testID="mark" />);
    const el = screen.getByTestId('mark');
    expect(el.props.style).toEqual(
      expect.objectContaining({ backgroundColor: colors.neutral.ink }),
    );
  });

  it('renders with paper frame', () => {
    render(<TabaMark frame="paper" testID="mark" />);
    const el = screen.getByTestId('mark');
    expect(el.props.style).toEqual(
      expect.objectContaining({ backgroundColor: colors.neutral.card }),
    );
  });

  it('renders boxed with smaller corner radius', () => {
    render(<TabaMark size={80} boxed testID="mark" />);
    const el = screen.getByTestId('mark');
    expect(el.props.style).toEqual(
      expect.objectContaining({ borderRadius: Math.round(80 * 0.18) }),
    );
  });

  it('renders the brand image', () => {
    const { UNSAFE_queryAllByType } = render(<TabaMark testID="mark" />);
    const Image = require('react-native').Image;
    const images = UNSAFE_queryAllByType(Image);
    expect(images.length).toBe(1);
  });
});

describe('TabaWordmark', () => {
  it('renders "Taba3ny" as single text when no gradient', () => {
    render(<TabaWordmark testID="wordmark" />);
    expect(screen.getByText('Taba3ny')).toBeTruthy();
  });

  it('renders split text with gradientThree', () => {
    render(<TabaWordmark gradientThree testID="wordmark" />);
    expect(screen.getByText('Taba')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('ny')).toBeTruthy();
  });

  it('applies custom color', () => {
    render(<TabaWordmark color="#FF0000" testID="wordmark" />);
    const el = screen.getByTestId('wordmark');
    expect(el).toBeTruthy();
  });

  it('applies custom size', () => {
    render(<TabaWordmark size={30} />);

    const RNText = require('react-native').Text;
    const texts = screen.UNSAFE_queryAllByType(RNText);
    expect(texts.length).toBeGreaterThanOrEqual(1);
  });
});
