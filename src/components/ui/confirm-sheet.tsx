import * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import colors from '@/components/ui/colors';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';

type ConfirmSheetProps = {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
};

export function ConfirmSheet({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
  testID,
}: ConfirmSheetProps) {
  const handleConfirm = React.useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  const handleCancel = React.useCallback(() => {
    onCancel();
  }, [onCancel]);

  return (
    <Sheet
      open={open}
      onClose={handleCancel}
      testID={testID}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}

        <View style={styles.actions}>
          <Pressable
            onPress={handleCancel}
            style={[styles.button, styles.cancelButton]}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
          >
            <Text style={styles.cancelLabel}>{cancelLabel}</Text>
          </Pressable>

          <Pressable
            onPress={handleConfirm}
            style={[
              styles.button,
              { backgroundColor: destructive ? colors.semantic.absent : colors.brand.primary },
            ]}
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
          >
            <Text style={styles.confirmLabel}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: colors.neutral.inkMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  cancelButton: {
    backgroundColor: colors.neutral['50'],
  },
  cancelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral.inkSoft,
  },
  confirmLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral.white,
  },
});
