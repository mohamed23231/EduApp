/* eslint-disable max-lines-per-function */
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import * as React from 'react';
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
  });

  it('ToastView renders message with ink tone by default', () => {
    render(<ToastView toast={{ message: 'Hello' }} testID="toast" />);
    const el = screen.getByTestId('toast');
    expect(el).toBeTruthy();
    expect(el.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: colors.neutral.ink }),
      ]),
    );
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('ToastView renders with lime tone', () => {
    render(<ToastView toast={{ message: 'Saved', tone: 'lime' }} testID="toast" />);
    const el = screen.getByTestId('toast');
    expect(el.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: colors.brand.primary }),
      ]),
    );
  });

  it('ToastView renders with absent tone', () => {
    render(<ToastView toast={{ message: 'Error', tone: 'absent' }} testID="toast" />);
    const el = screen.getByTestId('toast');
    expect(el.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: colors.semantic.absent }),
      ]),
    );
  });

  it('ToastView renders action button', () => {
    const onPress = jest.fn();
    render(
      <ToastView
        toast={{ message: 'Undo?', action: { label: 'Undo', onPress } }}
        testID="toast"
      />,
    );
    fireEvent.press(screen.getByText('Undo'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ToastHost shows toast when context show() is called', () => {
    let ctxRef: { show: (toast: Parameters<ReturnType<typeof useToast>['show']>[0]) => void } | null = null;

    function GrabContext() {
      ctxRef = React.use(ToastContext);
      return null;
    }

    render(
      <ToastHost>
        <GrabContext />
      </ToastHost>,
    );

    expect(ctxRef).not.toBeNull();
    expect(screen.queryByText('Hello')).toBeNull();

    act(() => {
      ctxRef!.show({ message: 'Hello' });
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
    let ctxRef: { show: (toast: Parameters<ReturnType<typeof useToast>['show']>[0]) => void } | null = null;

    function GrabContext() {
      ctxRef = React.use(ToastContext);
      return null;
    }

    render(
      <ToastHost placement="top">
        <GrabContext />
      </ToastHost>,
    );

    act(() => {
      ctxRef!.show({ message: 'Top toast' });
    });

    expect(screen.getByText('Top toast')).toBeTruthy();
  });
});
