import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { Modal } from '@/components/ui/modal';

type Props = {
  modalRef: React.RefObject<BottomSheetModal>;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CloseConfirmSheet({ modalRef, onCancel, onConfirm }: Props) {
  const { t } = useTranslation();

  return (
    <Modal
      ref={modalRef}
      snapPoints={['30%']}
      title={t('manager.sessionDetail.closeWarningTitle', { defaultValue: 'Close session' })}
    >
      <View style={styles.body}>
        <Text style={styles.subtitle}>
          {t('manager.sessionDetail.closeWarningSubtitle', {
            defaultValue: 'Unmarked students will be marked absent.',
          })}
        </Text>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.cancelAction}>
            {t('manager.common.cancel', { defaultValue: 'Cancel' })}
          </Text>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.destructiveAction}>
            {t('manager.sessionDetail.closeConfirm', { defaultValue: 'Confirm' })}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.neutral.inkMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  row: {
    backgroundColor: colors.neutral.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  rowPressed: { opacity: 0.75 },
  cancelAction: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral.ink,
  },
  destructiveAction: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.semantic.absent,
  },
});
