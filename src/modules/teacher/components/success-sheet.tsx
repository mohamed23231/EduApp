/**
 * SuccessSheet
 * Bottom-sheet success feedback replacing Alert.alert for
 * completed actions (attendance submitted, student created, etc.).
 */

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Modal, Text } from '@/components/ui';

type SuccessSheetProps = {
  ref?: React.RefObject<BottomSheetModal | null>;
  title: string;
  message?: string;
  primaryLabel?: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function SuccessSheet({
  ref,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: SuccessSheetProps) {
  const { t } = useTranslation();

  return (
    <Modal ref={ref} snapPoints={['46%']} title=" ">
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-circle" size={48} color="#10B981" />
        </View>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <View style={styles.buttons}>
          <Button
            label={primaryLabel ?? t('teacher.common.ok')}
            onPress={onPrimary}
            variant="default"
            style={styles.btn}
          />
          {secondaryLabel && onSecondary && (
            <Button
              label={secondaryLabel}
              onPress={onSecondary}
              variant="outline"
              style={styles.btn}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttons: {
    width: '100%',
    gap: 10,
  },
  btn: {
    width: '100%',
  },
});
