import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { Modal } from '@/components/ui/modal';
import { SUPPORT_WHATSAPP_URL } from '@/shared/constants/support';

type Props = {
  modalRef: React.RefObject<BottomSheetModal>;
  onCreateNewOrg: () => void;
};

export function TrialExpiredSheet({ modalRef, onCreateNewOrg }: Props) {
  const { t } = useTranslation();

  return (
    <Modal
      ref={modalRef}
      snapPoints={['35%']}
      title={t('manager.trial.expiredTitle', { defaultValue: 'Trial expired' })}
    >
      <View className="gap-1 px-5 pb-4">
        <Text className="mb-2 text-center text-sm" style={{ color: colors.neutral.inkMuted }}>
          {t('manager.trial.expiredMessage', {
            defaultValue:
              'This organization is read-only. Contact support to activate a subscription.',
          })}
        </Text>
        <Pressable
          onPress={onCreateNewOrg}
          className="items-center rounded-xl px-4 py-3.5"
          style={({ pressed }) => ({ backgroundColor: colors.neutral.card, opacity: pressed ? 0.75 : 1 })}
          accessibilityRole="button"
        >
          <Text className="text-body-lg font-semibold" style={{ color: colors.brand.primary }}>
            {t('manager.trial.createNewOrg', { defaultValue: 'Create new org' })}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            void Linking.openURL(SUPPORT_WHATSAPP_URL);
          }}
          className="items-center rounded-xl px-4 py-3.5"
          style={({ pressed }) => ({ backgroundColor: colors.neutral.card, opacity: pressed ? 0.75 : 1 })}
          accessibilityRole="button"
        >
          <Text className="text-body-lg font-semibold" style={{ color: colors.semantic.absent }}>
            {t('manager.trial.contactSupport', { defaultValue: 'Contact support' })}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
