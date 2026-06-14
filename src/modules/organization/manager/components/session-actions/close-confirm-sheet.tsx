import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
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
      <View className="gap-1 px-5 pb-4">
        <Text className="mb-2 text-center text-sm" style={{ color: colors.neutral.inkMuted }}>
          {t('manager.sessionDetail.closeWarningSubtitle', {
            defaultValue: 'Unmarked students will be marked absent.',
          })}
        </Text>
        <Pressable
          onPress={onCancel}
          className="items-center rounded-xl px-4 py-3.5"
          style={({ pressed }) => ({ backgroundColor: colors.neutral.card, opacity: pressed ? 0.75 : 1 })}
          accessibilityRole="button"
        >
          <Text className="text-body-lg font-semibold" style={{ color: colors.neutral.ink }}>
            {t('manager.common.cancel', { defaultValue: 'Cancel' })}
          </Text>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          className="items-center rounded-xl px-4 py-3.5"
          style={({ pressed }) => ({ backgroundColor: colors.neutral.card, opacity: pressed ? 0.75 : 1 })}
          accessibilityRole="button"
        >
          <Text className="text-body-lg font-semibold" style={{ color: colors.semantic.absent }}>
            {t('manager.sessionDetail.closeConfirm', { defaultValue: 'Confirm' })}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
