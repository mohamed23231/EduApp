import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import colors from '@/components/ui/colors';
import { Z_INDEX } from '@/components/ui/theme';

type ToastTone = 'ink' | 'lime' | 'absent';

export type ToastIntent = {
  id?: string;
  message: string;
  tone?: ToastTone;
  action?: { label: string; onPress: () => void };
  durationMs?: number | null;
  onDismiss?: () => void;
};

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

const TONE_BG: Record<ToastTone, string> = {
  ink: colors.neutral.ink,
  lime: colors.brand.primary,
  absent: colors.semantic.absent,
};

function ToastView({ toast, testID }: ToastViewProps) {
  const tone = toast.tone ?? 'ink';
  const bgColor = TONE_BG[tone];

  return (
    <View style={[styles.toast, { backgroundColor: bgColor }]} testID={testID}>
      <Text style={styles.message} numberOfLines={2}>
        {toast.message}
      </Text>
      {toast.action
        ? (
            <Pressable onPress={toast.action.onPress} hitSlop={8}>
              <Text style={styles.actionLabel}>{toast.action.label}</Text>
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
    color: colors.neutral.card,
    fontSize: 14,
    fontWeight: '500',
  },
  actionLabel: {
    color: colors.neutral.card,
    fontSize: 14,
    fontWeight: '700',
  },
});

export { ToastContext, ToastHost, ToastView, useToast };
