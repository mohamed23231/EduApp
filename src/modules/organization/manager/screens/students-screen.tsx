import type { OrgStudent } from '../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, I18nManager, Linking, RefreshControl, StyleSheet } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Input,
  Modal,
  OptionPickerSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { useModal } from '@/components/ui/modal';
import { AppRoute } from '@/core/navigation/routes';
import { NoOrgEmptyState } from '../components';
import {
  useDeleteStudent,
  useOrgStudents,
  useRegenerateStudentCode,
} from '../hooks';
import { useManagerStore } from '../store/manager-store';

const APP_DOWNLOAD_URL = 'https://privatedu.app';
const PAGE_LIMIT = 20;

const GRADE_KEYS = [
  'all',
  'grade1',
  'grade2',
  'grade3',
  'grade4',
  'grade5',
  'grade6',
  'grade7',
  'grade8',
  'grade9',
  'grade10',
  'grade11',
  'grade12',
  'university',
  'other',
] as const;

function StudentCard({ student, onPress, onLongPress }: { student: OrgStudent; onPress: () => void; onLongPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={student.name}
    >
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardName} numberOfLines={1}>{student.name}</Text>
          {student.hasParentLinked
            ? (
                <View style={styles.linkedBadge}>
                  <Ionicons name="link" size={12} color="#3B82F6" />
                  <Text style={styles.linkedText}>{t('manager.students.parentLinked')}</Text>
                </View>
              )
            : null}
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaText}>
            {student.gradeLevel || t('manager.students.noGrade')}
          </Text>
          {student.assignedSessionsCount !== undefined
            ? (
                <Text style={styles.cardMetaText}>
                  {t('manager.students.sessionsCount', { count: student.assignedSessionsCount })}
                </Text>
              )
            : null}
        </View>
      </View>
      <Ionicons
        name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
        size={18}
        color="#D1D5DB"
        style={styles.chevron}
      />
    </Pressable>
  );
}

function ActionChip({
  icon,
  label,
  onPress,
  color = '#3B82F6',
  bg = '#EFF6FF',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  bg?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, { backgroundColor: bg }, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.chipLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  color = '#374151',
  danger = false,
}: {
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
      <Ionicons
        name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
        size={16}
        color="#D1D5DB"
      />
    </Pressable>
  );
}

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
};

function PaginationControls({ page, totalPages, onPrev, onNext }: PaginationControlsProps) {
  const { t } = useTranslation();
  if (totalPages <= 1)
    return null;

  return (
    <View className="mt-4 flex-row items-center justify-between">
      <Button variant="outline" size="sm" label={t('manager.students.prevPage')} fullWidth={false} disabled={page <= 1} onPress={onPrev} />
      <Text className="font-inter text-sm text-slate-500">{t('manager.students.pageInfo', { page, total: totalPages })}</Text>
      <Button variant="outline" size="sm" label={t('manager.students.nextPage')} fullWidth={false} disabled={page >= totalPages} onPress={onNext} />
    </View>
  );
}

const DEBOUNCE_MS = 300;

// eslint-disable-next-line max-lines-per-function
function StudentListSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const deleteMutation = useDeleteStudent(activeOrgId);
  const regenerateMutation = useRegenerateStudentCode(activeOrgId);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<OrgStudent | null>(null);
  const gradePicker = useModal();
  const actionsSheet = useModal();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const studentsQuery = useOrgStudents(activeOrgId, { search, gradeLevel, page, limit: PAGE_LIMIT });

  useEffect(() => () => {
    if (debounceRef.current !== null)
      clearTimeout(debounceRef.current);
  }, []);

  const gradeOptions = useMemo(
    () => GRADE_KEYS.map(key => ({
      label: t(`manager.students.grades.${key}`),
      value: key === 'all' ? '' : key,
    })),
    [t],
  );

  const totalPages = useMemo(() => {
    const total = studentsQuery.data?.meta?.total ?? 0;
    return Math.max(1, Math.ceil(total / PAGE_LIMIT));
  }, [studentsQuery.data?.meta?.total]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchInput(text);
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setSearch(text);
      setPage(1);
    }, DEBOUNCE_MS);
  }, []);

  const handleGradeChange = (val: string | number) => {
    setGradeLevel(String(val));
    setPage(1);
  };

  const handleStudentPress = (student: OrgStudent) => {
    router.push(AppRoute.manager.studentDetail(student.id));
  };

  const handleStudentLongPress = (student: OrgStudent) => {
    setSelectedStudent(student);
    actionsSheet.present();
  };

  const handleCopy = async () => {
    if (!selectedStudent)
      return;
    await Clipboard.setStringAsync(selectedStudent.connectionCode);
    Alert.alert(t('manager.students.copiedTitle'), t('manager.students.copiedBody'));
  };

  const handleWhatsApp = async () => {
    if (!selectedStudent)
      return;
    const message = `${selectedStudent.name} - ${selectedStudent.connectionCode}\n${APP_DOWNLOAD_URL}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
    else {
      await Clipboard.setStringAsync(message);
      Alert.alert(
        t('manager.whatsapp.copiedTitle', { defaultValue: 'Copied' }),
        t('manager.whatsapp.copiedBody', { defaultValue: 'WhatsApp is unavailable, message copied.' }),
      );
    }
  };

  const handleDelete = () => {
    if (!selectedStudent)
      return;
    Alert.alert(
      t('manager.students.deleteTitle'),
      t('manager.students.deleteMessage'),
      [
        { text: t('manager.common.cancel'), style: 'cancel' },
        {
          text: t('manager.students.deleteConfirm'),
          style: 'destructive',
          onPress: () => {
            actionsSheet.dismiss();
            deleteMutation.mutate(selectedStudent.id);
          },
        },
      ],
    );
  };

  const handleRegenerate = () => {
    if (!selectedStudent)
      return;
    Alert.alert(
      t('manager.students.regenerateTitle', { defaultValue: 'Regenerate code?' }),
      t('manager.students.regenerateMessage', { defaultValue: 'The old code will stop working immediately.' }),
      [
        { text: t('manager.common.cancel'), style: 'cancel' },
        {
          text: t('manager.students.actions.regenerate'),
          onPress: () => {
            actionsSheet.dismiss();
            regenerateMutation.mutate(selectedStudent.id);
          },
        },
      ],
    );
  };

  const renderResults = () => {
    if (studentsQuery.isLoading) {
      return (
        <View className="mt-6 items-center py-10">
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      );
    }
    if (studentsQuery.isError) {
      return (
        <View className="mt-6 items-center gap-3 py-6">
          <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
          <Text className="font-inter text-sm text-red-600">{t('manager.students.errorLoading')}</Text>
          <Button variant="outline" size="sm" label={t('manager.students.errorRetry')} fullWidth={false} onPress={() => studentsQuery.refetch()} />
        </View>
      );
    }
    const students = studentsQuery.data?.data ?? [];
    return (
      <View className="mt-4 gap-3">
        {students.map(student => (
          <StudentCard
            key={student.id}
            student={student}
            onPress={() => handleStudentPress(student)}
            onLongPress={() => handleStudentLongPress(student)}
          />
        ))}
        {students.length === 0
          ? <Text className="font-inter text-sm text-slate-500">{t('manager.students.empty')}</Text>
          : null}
        <PaginationControls
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage(p => Math.max(1, p - 1))}
          onNext={() => setPage(p => Math.min(totalPages, p + 1))}
        />
      </View>
    );
  };

  return (
    <View className="mt-5 rounded-[28px] bg-white p-5">
      <Input label={t('manager.students.search')} value={searchInput} onChangeText={handleSearchChange} />
      <Pressable
        onPress={gradePicker.present}
        className="mb-4 flex-row items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
      >
        <Text className="font-inter text-sm text-slate-700">
          {gradeOptions.find(o => o.value === gradeLevel)?.label
            ?? t('manager.students.grades.label', { defaultValue: 'All grades' })}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
      </Pressable>
      {renderResults()}

      <Modal ref={actionsSheet.ref} snapPoints={['55%']} title={selectedStudent?.name ?? ''}>
        <View style={styles.sheetContent}>
          <View style={styles.codeSection}>
            <View style={styles.codeBox}>
              <Text style={styles.codeLabel}>{t('manager.students.connectionCode')}</Text>
              <Text style={styles.codeText}>{selectedStudent?.connectionCode}</Text>
            </View>
            <View style={styles.codeChips}>
              <ActionChip
                icon="copy-outline"
                label={t('manager.students.actions.copy')}
                onPress={handleCopy}
              />
              <ActionChip
                icon="logo-whatsapp"
                label={t('manager.whatsapp.share', { defaultValue: 'WhatsApp' })}
                onPress={handleWhatsApp}
                color="#25D366"
                bg="#F0FDF4"
              />
            </View>
          </View>
          <View style={styles.sheetActions}>
            <ActionRow
              icon="refresh-outline"
              label={t('manager.students.actions.regenerate')}
              onPress={handleRegenerate}
              color="#F59E0B"
            />
            <ActionRow
              icon="trash-outline"
              label={t('manager.students.actions.delete')}
              onPress={handleDelete}
              color="#DC2626"
              danger
            />
          </View>
        </View>
      </Modal>

      <OptionPickerSheet
        ref={gradePicker.ref}
        title={t('manager.students.gradeFilter', { defaultValue: 'Filter by grade' })}
        options={gradeOptions}
        value={gradeLevel}
        onSelect={val => handleGradeChange(val)}
      />
    </View>
  );
}

export function StudentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const studentsListQuery = useOrgStudents(activeOrgId);

  const onRefresh = useCallback(() => {
    studentsListQuery.refetch();
  }, [studentsListQuery]);

  if (!activeOrgId) {
    return <NoOrgEmptyState />;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <View className="flex-row items-center justify-between px-6 pt-6 pb-2">
        <View className="flex-1">
          <Text className="font-inter text-3xl font-semibold text-slate-900">
            {t('manager.students.title', { defaultValue: 'Students' })}
          </Text>
          <Text className="font-inter mt-1 text-base text-slate-500">
            {t('manager.students.subtitle', {
              defaultValue:
                'Search the roster, share connection codes, and keep parent contact details fresh.',
            })}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push(AppRoute.manager.studentCreate)}
          className="ms-3 size-10 items-center justify-center rounded-full bg-[#3B82F6]"
          accessibilityLabel={t('manager.students.actions.create', {
            defaultValue: 'Create student',
          })}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={24} color="white" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="px-6 pb-8 pt-2"
        refreshControl={(
          <RefreshControl
            refreshing={studentsListQuery.isRefetching}
            onRefresh={onRefresh}
          />
        )}
      >
        <StudentListSection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: { backgroundColor: '#F8FAFC' },
  cardBody: { flex: 1, gap: 4 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#0F172A' },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  linkedText: { fontSize: 11, color: '#3B82F6', fontWeight: '500' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardMetaText: { fontSize: 13, color: '#64748B' },
  chevron: { flexShrink: 0 },
  // Actions sheet
  sheetContent: { paddingHorizontal: 20, paddingBottom: 32, gap: 16 },
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
    gap: 4,
  },
  codeLabel: { fontSize: 11, color: '#93C5FD', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  codeText: { fontSize: 22, fontWeight: '800', color: '#1D4ED8', letterSpacing: 4, textAlign: 'center' },
  codeChips: { flexDirection: 'row', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  chipLabel: { fontSize: 13, fontWeight: '600' },
  sheetActions: { gap: 2 },
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
