/**
 * ConfirmSheet
 * Bottom-sheet confirmation dialog replacing Alert.alert for
 * destructive actions (delete, regenerate).
 */

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Modal, Text } from '@/components/ui';

type ConfirmSheetProps = {
  ref?: React.RefObject<BottomSheetModal | null>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: 'destructive' | 'default';
};

export function ConfirmSheet({
  ref,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isLoading,
  variant = 'destructive',
}: ConfirmSheetProps) {
  const { t } = useTranslation();

  return (
    <Modal ref={ref} snapPoints={['38%']} title={title}>
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.buttons}>
          <Button
            label={confirmLabel ?? t('teacher.common.confirm')}
            onPress={onConfirm}
            loading={isLoading}
            variant={variant}
            style={styles.btn}
          />
          <Button
            label={cancelLabel ?? t('teacher.common.cancel')}
            onPress={onCancel}
            variant="outline"
            style={styles.btn}
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
    color: '#4B5563',
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
