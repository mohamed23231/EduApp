import * as React from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';

import colors from '@/components/ui/colors';
import { Z_INDEX } from '@/components/ui/theme';

export type ToastKind = 'success' | 'error' | 'info' | 'undo';

type ToastAction = { label: string; onPress: () => void };

type ToastCommon = {
  id?: string;
  message: string;
  durationMs?: number | null;
  onDismiss?: () => void;
};

// Semantic kinds (State Kit). `undo` requires an action — it is the only thing
// that distinguishes it from `info`. success/error/info default to `info` when
// kind is omitted, so a bare `{ message }` stays valid.
export type ToastIntent
  = | (ToastCommon & { kind?: 'success' | 'error' | 'info'; action?: ToastAction })
    | (ToastCommon & { kind: 'undo'; action: ToastAction });

type ToastHostProps = {
  placement?: 'bottom' | 'top';
  children?: React.ReactNode;
};

type ToastViewProps = {
  toast: ToastIntent;
  testID?: string;
};

type ToastContextValue = {
  show: (toast: ToastIntent) => void;
  dismiss: (id?: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

const KIND_BG: Record<ToastKind, string> = {
  success: colors.brand.primary,
  error: colors.semantic.absent,
  info: colors.neutral.ink,
  undo: colors.neutral.ink,
};

// On the green success surface the foreground is dark ink (8.6:1 — clears AA);
// on the dark/red surfaces it is white. The action label echoes the design:
// dark ink on success, brand green on the dark surfaces.
const KIND_FG: Record<ToastKind, string> = {
  success: colors.neutral.ink,
  error: colors.neutral.card,
  info: colors.neutral.card,
  undo: colors.neutral.card,
};

function ToastView({ toast, testID }: ToastViewProps) {
  const kind = toast.kind ?? 'info';
  const bgColor = KIND_BG[kind];
  const fgColor = KIND_FG[kind];
  const actionColor = kind === 'success' ? colors.neutral.ink : colors.brand.primary;

  return (
    <View
      style={[styles.toast, { backgroundColor: bgColor }]}
      testID={testID}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.message, { color: fgColor }]} numberOfLines={2}>
        {toast.message}
      </Text>
      {toast.action
        ? (
            <Pressable
              onPress={toast.action.onPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={toast.action.label}
            >
              <Text style={[styles.actionLabel, { color: actionColor }]}>{toast.action.label}</Text>
            </Pressable>
          )
        : null}
    </View>
  );
}

const DEFAULT_DURATION = 2400;

function ToastHost({ placement = 'bottom', children }: ToastHostProps) {
  const [currentToast, setCurrentToast] = React.useState<ToastIntent | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismiss = React.useCallback((id?: string) => {
    setCurrentToast((prev) => {
      if (prev && (id === undefined || prev.id === id)) {
        prev.onDismiss?.();
        clearTimer();
        return null;
      }
      return prev;
    });
  }, [clearTimer]);

  const show = React.useCallback((toast: ToastIntent) => {
    clearTimer();
    setCurrentToast(toast);
    // Announce to screen readers (covers iOS, where accessibilityLiveRegion is a no-op).
    AccessibilityInfo.announceForAccessibility?.(toast.message);

    const duration = toast.durationMs === null ? null : (toast.durationMs ?? DEFAULT_DURATION);
    if (duration !== null) {
      timerRef.current = setTimeout(() => {
        setCurrentToast((prev) => {
          if (prev !== null && (prev.id === toast.id || prev === toast)) {
            prev.onDismiss?.();
            return null;
          }
          return prev;
        });
        timerRef.current = null;
      }, duration);
    }
  }, [clearTimer]);

  const contextValue = React.useMemo<ToastContextValue>(
    () => ({ show, dismiss }),
    [show, dismiss],
  );

  React.useEffect(() => clearTimer, [clearTimer]);

  return (
    <ToastContext value={contextValue}>
      {children}
      {currentToast
        ? (
            <View
              style={[
                styles.host,
                placement === 'top' ? styles.hostTop : styles.hostBottom,
              ]}
              pointerEvents="box-none"
            >
              <ToastView toast={currentToast} testID="toast-view" />
            </View>
          )
        : null}
    </ToastContext>
  );
}

function useToast(): ToastContextValue {
  const ctx = React.use(ToastContext);
  if (ctx === null) {
    throw new Error('useToast must be used within a <ToastHost>');
  }
  return ctx;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    start: 16,
    end: 16,
    zIndex: Z_INDEX.toast,
    pointerEvents: 'box-none',
  },
  hostTop: {
    top: 60,
  },
  hostBottom: {
    bottom: 40,
  },
  toast: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export { ToastContext, ToastHost, ToastView, useToast };
