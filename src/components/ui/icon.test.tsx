import * as React from 'react';
import { I18nManager, View } from 'react-native';

import { cleanup, render, screen } from '@/lib/test-utils';

import { Icon, ICON_MAP, resolveIconName, RTL_FLIP_NAMES } from './icon';

afterEach(cleanup);

describe('icon', () => {
  it('renders without crashing', () => {
    render(<Icon name="check" />);
  });

  it('resolves each mapping to the correct Ionicons glyph name', () => {
    const entries = Object.entries(ICON_MAP);
    entries.forEach(([name, glyph]) => {
      expect(resolveIconName(name)).toBe(glyph);
    });
  });

  it('falls back to help-outline for unknown names', () => {
    expect(resolveIconName('nonExistentIcon')).toBe('help-outline');
  });

  it('applies scaleX: -1 for flip names in RTL mode', () => {
    const originalRTL = I18nManager.isRTL;
    (I18nManager as { isRTL: boolean }).isRTL = true;

    for (const name of RTL_FLIP_NAMES) {
      const { unmount } = render(<Icon name={name} />);
      const wrappers = screen.UNSAFE_queryAllByType(View);
      const flipped = wrappers.find(
        w => w.props.style?.transform?.[0]?.scaleX === -1,
      );
      expect(flipped).toBeTruthy();
      unmount();
    }

    (I18nManager as { isRTL: boolean }).isRTL = originalRTL;
  });

  it('does not apply flip for flip names in LTR mode', () => {
    const originalRTL = I18nManager.isRTL;
    (I18nManager as { isRTL: boolean }).isRTL = false;

    for (const name of RTL_FLIP_NAMES) {
      const { unmount } = render(<Icon name={name} />);
      const wrappers = screen.UNSAFE_queryAllByType(View);
      const flipped = wrappers.find(
        w => w.props.style?.transform?.[0]?.scaleX === -1,
      );
      expect(flipped).toBeFalsy();
      unmount();
    }

    (I18nManager as { isRTL: boolean }).isRTL = originalRTL;
  });

  it('renders with default size 20', () => {
    const { unmount } = render(<Icon name="check" />);
    unmount();
  });

  it('renders with custom size', () => {
    const { unmount } = render(<Icon name="check" size={32} />);
    unmount();
  });
});
