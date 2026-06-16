/* eslint-disable max-lines-per-function */
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import * as React from 'react';
import { AccessibilityInfo } from 'react-native';
import colors from '@/components/ui/colors';

import { ToastContext, ToastHost, ToastView, useToast } from '@/components/ui/toast-host';
import { act, cleanup, fireEvent, render, screen } from '@/lib/test-utils';

// Hoisted GrabContext component — declaring it here (not inside try blocks)
// keeps `React.use(ToastContext)` outside any try/catch as required by
// react-hooks/rules-of-hooks.
type ContextRef = { current: ReturnType<typeof useToast> | null };
function makeGrabContext(ref: ContextRef) {
  return function GrabContext() {
    ref.current = React.use(ToastContext);
    return null;
  };
}

describe('ToastHost + ToastView + useToast', () => {
  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  it('defaults to info kind (ink bg, white foreground) when kind is omitted', () => {
    render(<ToastView toast={{ message: 'Hello' }} testID="toast" />);
    const el = screen.getByTestId('toast');
    expect(el.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: colors.neutral.ink }),
      ]),
    );
    expect(screen.getByText('Hello').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: colors.neutral.card })]),
    );
  });

  it('success kind renders green bg with DARK ink foreground (WCAG fix)', () => {
    render(<ToastView toast={{ message: 'Saved', kind: 'success' }} testID="toast" />);
    expect(screen.getByTestId('toast').props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: colors.brand.primary }),
      ]),
    );
    // The whole point of the contrast fix: ink (not white) on green.
    expect(screen.getByText('Saved').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: colors.neutral.ink })]),
    );
  });

  it('error kind renders the absent (red) bg', () => {
    render(<ToastView toast={{ message: 'Error', kind: 'error' }} testID="toast" />);
    expect(screen.getByTestId('toast').props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: colors.semantic.absent }),
      ]),
    );
  });

  it('undo kind renders an action whose label is brand green on the dark surface', () => {
    const onPress = jest.fn();
    render(
      <ToastView
        toast={{ message: 'Removed', kind: 'undo', action: { label: 'Undo', onPress } }}
        testID="toast"
      />,
    );
    expect(screen.getByTestId('toast').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: colors.neutral.ink })]),
    );
    const action = screen.getByText('Undo');
    expect(action.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: colors.brand.primary })]),
    );
    fireEvent.press(action);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('success action label uses ink (not green) on the green surface', () => {
    render(
      <ToastView
        toast={{ message: 'Saved', kind: 'success', action: { label: 'View', onPress: () => {} } }}
        testID="toast"
      />,
    );
    expect(screen.getByText('View').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: colors.neutral.ink })]),
    );
  });

  it('exposes an alert role + polite live region for screen readers', () => {
    render(<ToastView toast={{ message: 'Heads up', kind: 'info' }} testID="toast" />);
    const el = screen.getByTestId('toast');
    expect(el.props.accessibilityRole).toBe('alert');
    expect(el.props.accessibilityLiveRegion).toBe('polite');
  });

  it('announces the message to the accessibility service on show()', () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    const ref: ContextRef = { current: null };
    const GrabContext = makeGrabContext(ref);
    render(<ToastHost><GrabContext /></ToastHost>);
    act(() => {
      ref.current!.show({ message: 'Announced', kind: 'success' });
    });
    expect(announce).toHaveBeenCalledWith('Announced');
  });

  it('ToastHost shows toast when context show() is called', () => {
    const ref: ContextRef = { current: null };
    const GrabContext = makeGrabContext(ref);
    render(<ToastHost><GrabContext /></ToastHost>);

    expect(ref.current).not.toBeNull();
    expect(screen.queryByText('Hello')).toBeNull();

    act(() => {
      ref.current!.show({ message: 'Hello' });
    });

    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('ToastHost auto-dismisses after duration', () => {
    const ref: ContextRef = { current: null };
    const GrabContext = makeGrabContext(ref);
    jest.useFakeTimers();
    try {
      render(<ToastHost><GrabContext /></ToastHost>);
      act(() => {
        ref.current!.show({ message: 'Auto dismiss', durationMs: 500 });
      });
      expect(screen.getByText('Auto dismiss')).toBeTruthy();
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(screen.queryByText('Auto dismiss')).toBeNull();
    }
    finally {
      jest.useRealTimers();
    }
  });

  it('ToastHost persistent toast does not auto-dismiss', () => {
    const ref: ContextRef = { current: null };
    const GrabContext = makeGrabContext(ref);
    jest.useFakeTimers();
    try {
      render(<ToastHost><GrabContext /></ToastHost>);
      act(() => {
        ref.current!.show({ message: 'Persistent', durationMs: null });
      });
      act(() => {
        jest.advanceTimersByTime(60000);
      });
      expect(screen.getByText('Persistent')).toBeTruthy();
    }
    finally {
      jest.useRealTimers();
    }
  });

  it('useToast throws when used outside ToastHost', () => {
    const Outside = () => {
      useToast();
      return null;
    };

    expect(() => render(<Outside />)).toThrow(
      'useToast must be used within a <ToastHost>',
    );
  });

  it('ToastHost respects placement="top"', () => {
    const ref: ContextRef = { current: null };
    const GrabContext = makeGrabContext(ref);
    render(
      <ToastHost placement="top">
        <GrabContext />
      </ToastHost>,
    );

    act(() => {
      ref.current!.show({ message: 'Top toast' });
    });

    expect(screen.getByText('Top toast')).toBeTruthy();
  });
});
