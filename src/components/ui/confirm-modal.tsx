/**
 * ConfirmModal
 *
 * Floating centered confirmation dialog.
 * Replaces native Alert.alert with a polished, themed modal.
 *
 * Usage:
 *   const [visible, setVisible] = useState(false);
 *   <ConfirmModal
 *     visible={visible}
 *     title="Delete student?"
 *     message="This action cannot be undone."
 *     confirmLabel="Delete"
 *     cancelLabel="Cancel"
 *     variant="destructive"
 *     onConfirm={() => { ... }}
 *     onCancel={() => setVisible(false)}
 *   />
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';

import tokens from './colors';
import { Text } from './text';

type ConfirmModalVariant = 'default' | 'destructive' | 'success';

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmModalVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Hide cancel button (single-action modal, e.g. success acknowledgement) */
  hideCancelButton?: boolean;
  /** Disable Reanimated enter/exit transitions for a plain floating modal */
  disableAnimations?: boolean;
};

const VARIANT_COLORS: Record<ConfirmModalVariant, { bg: string; text: string }> = {
  default: { bg: tokens.neutral.ink, text: tokens.neutral.white },
  destructive: { bg: tokens.semantic.absent, text: tokens.neutral.white },
  success: { bg: tokens.semantic.present, text: tokens.neutral.white },
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
  hideCancelButton = false,
  disableAnimations = false,
}: ConfirmModalProps) {
  const { t } = useTranslation();
  const colors = VARIANT_COLORS[variant];
  const resolvedConfirmLabel = confirmLabel ?? t('common.confirm', 'Confirm');
  const resolvedCancelLabel = cancelLabel ?? t('common.cancel', 'Cancel');

  const content = (
    <>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <View style={styles.actions}>
        {!hideCancelButton && (
          <Pressable
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={loading}
            accessibilityRole="button"
          >
            <Text style={styles.cancelLabel}>{resolvedCancelLabel}</Text>
          </Pressable>
        )}
        <Pressable
          style={[
            styles.confirmButton,
            { backgroundColor: colors.bg },
            loading && styles.buttonDisabled,
          ]}
          onPress={onConfirm}
          disabled={loading}
          accessibilityRole="button"
        >
          <Text style={[styles.confirmLabel, { color: colors.text }]}>
            {loading ? '...' : resolvedConfirmLabel}
          </Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      {disableAnimations
        ? (
            <View style={styles.backdrop}>
              <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
              <View style={styles.card} accessibilityViewIsModal>
                {content}
              </View>
            </View>
          )
        : (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={styles.backdrop}
            >
              <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />

              <Animated.View
                entering={ZoomIn.duration(250).springify().damping(18)}
                exiting={ZoomOut.duration(150)}
                style={styles.card}
                accessibilityViewIsModal
              >
                {content}
              </Animated.View>
            </Animated.View>
          )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: tokens.overlay.modal,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: tokens.neutral.card,
    borderRadius: 20,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: tokens.neutral.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.neutral.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: tokens.neutral.inkMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: tokens.neutral.paper,
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: tokens.neutral.inkSoft,
  },
  confirmButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  confirmLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
