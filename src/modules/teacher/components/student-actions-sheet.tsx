/**
 * StudentActionsSheet
 * Bottom sheet with contextual quick actions for a student row.
 * Replaces full-screen navigation for code/regenerate/delete.
 */

import type { AccessCode, Student } from '../types';
import { Ionicons } from '@expo/vector-icons';
import * as Burnt from 'burnt';
import * as ExpoClipboard from 'expo-clipboard';
import { useCallback, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  I18nManager,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { Modal, Text, useModal } from '@/components/ui';
import { deleteStudent, getAccessCode, regenerateAccessCode } from '../services';
import { ConfirmSheet } from './confirm-sheet';

export type StudentActionsSheetRef = {
  open: (student: Student) => void;
};

type Props = {
  onEdit: (id: string) => void;
  onDeleted: () => void;
};

function useStudentActions(onDeleted: () => void) {
  const { t } = useTranslation();
  const sheetModal = useModal();
  const confirmDeleteModal = useModal();
  const confirmRegenModal = useModal();

  const [student, setStudent] = useState<Student | null>(null);
  const [code, setCode] = useState<AccessCode | null>(null);
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const openSheet = useCallback((s: Student) => {
    setStudent(s);
    setCode(null);
    setIsLoadingCode(true);
    sheetModal.present();
    getAccessCode(s.id)
      .then(setCode)
      .catch(() => setCode(null))
      .finally(() => setIsLoadingCode(false));
  }, [sheetModal]);

  const handleCopy = useCallback(async () => {
    if (!code)
      return;
    ExpoClipboard.setStringAsync(code.code);
    Burnt.toast({ title: t('teacher.toast.copied'), preset: 'done', haptic: 'success' });
  }, [code, t]);

  const handleShare = useCallback(async () => {
    if (!code)
      return;
    try {
      await Share.share({ message: code.code });
    }
    catch { /* user cancelled */ }
  }, [code]);

  const handleRegenerate = useCallback(async () => {
    if (!student)
      return;
    setIsRegenerating(true);
    try {
      const newCode = await regenerateAccessCode(student.id);
      setCode(newCode);
      confirmRegenModal.dismiss();
      Burnt.toast({ title: t('teacher.studentActions.codeRegenerated'), preset: 'done', haptic: 'success' });
    }
    catch {
      Burnt.toast({ title: t('teacher.common.genericError'), preset: 'error', haptic: 'error' });
    }
    finally {
      setIsRegenerating(false);
    }
  }, [student, confirmRegenModal, t]);

  const handleDelete = useCallback(async () => {
    if (!student)
      return;
    setIsDeleting(true);
    try {
      await deleteStudent(student.id);
      confirmDeleteModal.dismiss();
      sheetModal.dismiss();
      Burnt.toast({ title: t('teacher.studentActions.studentDeleted'), preset: 'done', haptic: 'success' });
      onDeleted();
    }
    catch {
      Burnt.toast({ title: t('teacher.common.genericError'), preset: 'error', haptic: 'error' });
    }
    finally {
      setIsDeleting(false);
    }
  }, [student, confirmDeleteModal, sheetModal, t, onDeleted]);

  return {
    student,
    code,
    isLoadingCode,
    isRegenerating,
    isDeleting,
    sheetModal,
    confirmDeleteModal,
    confirmRegenModal,
    openSheet,
    handleCopy,
    handleShare,
    handleRegenerate,
    handleDelete,
  };
}

function CodeSection({ code, isLoadingCode, onCopy, onShare, t }: {
  code: AccessCode | null;
  isLoadingCode: boolean;
  onCopy: () => void;
  onShare: () => void;
  t: (key: string) => string;
}) {
  if (isLoadingCode)
    return <ActivityIndicator size="small" color="#3B82F6" />;
  if (!code)
    return <Text style={styles.noCode}>{t('teacher.studentActions.noCode')}</Text>;
  return (
    <>
      <View style={styles.codeBox}>
        <Text style={styles.codeText}>{code.code}</Text>
      </View>
      <View style={styles.codeActions}>
        <ActionChip icon="copy-outline" label={t('teacher.studentActions.copyCode')} onPress={onCopy} color="#3B82F6" bg="#EFF6FF" />
        <ActionChip icon="share-outline" label={t('teacher.studentActions.shareCode')} onPress={onShare} color="#3B82F6" bg="#EFF6FF" />
      </View>
    </>
  );
}

export function StudentActionsSheet({ ref, onEdit, onDeleted, onViewPerformance }: Props & { ref?: React.RefObject<StudentActionsSheetRef | null>; onViewPerformance?: (id: string) => void }) {
  const { t } = useTranslation();
  const state = useStudentActions(onDeleted);

  useImperativeHandle(ref, () => ({ open: state.openSheet }));

  if (!state.student)
    return null;

  const handleEditPress = () => {
    state.sheetModal.dismiss();
    onEdit(state.student!.id);
  };

  const handlePerformancePress = () => {
    state.sheetModal.dismiss();
    onViewPerformance?.(state.student!.id);
  };

  return (
    <>
      <Modal ref={state.sheetModal.ref} snapPoints={['55%']} title={state.student.name}>
        <View style={styles.content}>
          <View style={styles.codeSection}>
            <CodeSection code={state.code} isLoadingCode={state.isLoadingCode} onCopy={state.handleCopy} onShare={state.handleShare} t={t} />
          </View>
          <View style={styles.actions}>
            <ActionRow icon="create-outline" label={t('teacher.studentActions.editStudent')} onPress={handleEditPress} />
            {onViewPerformance && <ActionRow icon="bar-chart-outline" label={t('teacher.performance.studentPerformance')} onPress={handlePerformancePress} color="#3B82F6" />}
            {state.code && <ActionRow icon="refresh-outline" label={t('teacher.studentActions.regenerateCode')} onPress={() => state.confirmRegenModal.present()} color="#F59E0B" />}
            <ActionRow icon="trash-outline" label={t('teacher.studentActions.deleteStudent')} onPress={() => state.confirmDeleteModal.present()} color="#DC2626" danger />
          </View>
        </View>
      </Modal>
      <ConfirmSheet ref={state.confirmRegenModal.ref} title={t('teacher.connectionCode.confirmRegenerateTitle')} message={t('teacher.studentActions.confirmRegenerate')} confirmLabel={t('teacher.common.confirm')} cancelLabel={t('teacher.common.cancel')} onConfirm={state.handleRegenerate} onCancel={state.confirmRegenModal.dismiss} isLoading={state.isRegenerating} variant="default" />
      <ConfirmSheet ref={state.confirmDeleteModal.ref} title={t('teacher.students.deleteConfirmTitle')} message={t('teacher.studentActions.confirmDelete')} confirmLabel={t('teacher.common.delete')} cancelLabel={t('teacher.common.cancel')} onConfirm={state.handleDelete} onCancel={state.confirmDeleteModal.dismiss} isLoading={state.isDeleting} variant="destructive" />
    </>
  );
}

function ActionChip({ icon, label, onPress, color, bg }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color: string;
  bg: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, { backgroundColor: bg }, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.chipLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

function ActionRow({ icon, label, onPress, color = '#374151', danger = false }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        danger && styles.actionRowDanger,
        pressed && { backgroundColor: danger ? '#FEF2F2' : '#F9FAFB' },
      ]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.actionRowLabel, { color }]}>{label}</Text>
      <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color="#D1D5DB" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
  codeSection: { alignItems: 'center', gap: 12 },
  codeBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%',
  },
  codeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 3,
    textAlign: 'center',
  },
  codeActions: { flexDirection: 'row', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  chipLabel: { fontSize: 13, fontWeight: '600' },
  noCode: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic' },
  actions: { gap: 2 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  actionRowDanger: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  actionRowLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
});
