import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
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
      <View style={styles.body}>
        <Text style={styles.subtitle}>
          {t('manager.trial.expiredMessage', {
            defaultValue:
              'This organization is read-only. Contact support to activate a subscription.',
          })}
        </Text>
        <Pressable
          onPress={onCreateNewOrg}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryAction}>
            {t('manager.trial.createNewOrg', { defaultValue: 'Create new org' })}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => { void Linking.openURL(SUPPORT_WHATSAPP_URL); }}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          accessibilityRole="button"
        >
          <Text style={styles.destructiveAction}>
            {t('manager.trial.contactSupport', { defaultValue: 'Contact support' })}
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
  primaryAction: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.brand.primary,
  },
  destructiveAction: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.semantic.absent,
  },
});
