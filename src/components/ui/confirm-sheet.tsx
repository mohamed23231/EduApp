/**
 * ConfirmSheet
 * Canonical branded confirmation bottom sheet (ref-based, @gorhom/bottom-sheet).
 *
 * Encodes the locked 3-value confirm-color law via the `intent` prop:
 *   - intent="routine"     → ink   (neutral.ink)        — default
 *   - intent="reversible"  → amber (semantic.excused)
 *   - intent="destructive" → red   (semantic.absent)
 *
 * Backward compatibility: the legacy `variant` prop is still accepted and
 * mapped onto an intent (destructive → destructive, default → routine). When
 * both are supplied, `intent` wins. This keeps existing call sites unchanged.
 */

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button, Modal, Text } from '@/components/ui';
import colors from '@/components/ui/colors';

export type ConfirmIntent = 'routine' | 'reversible' | 'destructive';

type LegacyVariant = 'destructive' | 'default';

type ConfirmSheetProps = {
  ref?: React.RefObject<BottomSheetModal | null>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  /** Drives the confirm button color. Defaults to 'routine' (ink). */
  intent?: ConfirmIntent;
  /** @deprecated Use `intent`. Mapped to an intent; `intent` wins if both set. */
  variant?: LegacyVariant;
};

const INTENT_COLOR: Record<ConfirmIntent, string> = {
  routine: colors.neutral.ink,
  reversible: colors.semantic.excused,
  destructive: colors.semantic.absent,
};

function resolveIntent(intent?: ConfirmIntent, variant?: LegacyVariant): ConfirmIntent {
  if (intent)
    return intent;
  if (variant === 'destructive')
    return 'destructive';
  return 'routine';
}

export function ConfirmSheet({
  ref,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isLoading,
  intent,
  variant,
}: ConfirmSheetProps) {
  const { t } = useTranslation();
  const resolvedIntent = resolveIntent(intent, variant);
  const confirmColor = INTENT_COLOR[resolvedIntent];

  return (
    <Modal ref={ref} snapPoints={['38%']} title={title}>
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.buttons}>
          <Button
            label={confirmLabel ?? t('teacher.common.confirm')}
            onPress={onConfirm}
            loading={isLoading}
            variant="default"
            style={[styles.btn, { backgroundColor: confirmColor }]}
            testID={`confirm-sheet-confirm-${resolvedIntent}`}
          />
          <Button
            label={cancelLabel ?? t('teacher.common.cancel')}
            onPress={onCancel}
            variant="outline"
            style={styles.btn}
            testID="confirm-sheet-cancel"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  message: {
    fontSize: 15,
    color: colors.neutral.inkMuted,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttons: {
    gap: 10,
  },
  btn: {
    width: '100%',
  },
});
