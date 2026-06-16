/**
 * NextStepSheet — student-create
 * Post-creation next-step bottom sheet (assign to session / share code / done).
 * Extracted from student-create-screen.
 */

import type { useModal } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Modal, Text } from '@/components/ui';

type NextStepSheetProps = {
  modal: ReturnType<typeof useModal>;
  onAssign: () => void;
  onShare: () => void;
  onDone: () => void;
};

export function NextStepSheet({ modal, onAssign, onShare, onDone }: NextStepSheetProps) {
  const { t } = useTranslation();
  return (
    <Modal ref={modal.ref} snapPoints={['48%']} title={t('teacher.students.createdFlowTitle')}>
      <View style={styles.sheetContent}>
        <Text style={styles.sheetMessage}>{t('teacher.students.createdFlowMessage')}</Text>
        <Button label={t('teacher.students.createdFlowAssignSession')} onPress={onAssign} variant="default" style={styles.sheetBtn} />
        <Button label={t('teacher.students.createdFlowShareCode')} onPress={onShare} variant="outline" style={styles.sheetBtn} />
        <Button label={t('teacher.common.cancel')} onPress={onDone} variant="ghost" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 10,
  },
  sheetMessage: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  sheetBtn: {
    width: '100%',
  },
});
