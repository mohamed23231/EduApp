import type { OrgStudent } from '../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, I18nManager, Linking, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Button,
  EmptyState,
  Input,
  Modal,
  Monogram,
  OptionPickerSheet,
  Pressable,
  Text,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { useModal } from '@/components/ui/modal';
import { useMonogramTone } from '@/components/ui/monogram';
import { AppRoute } from '@/core/navigation/routes';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import { NoOrgEmptyState } from '../components';
import {
  useDeleteStudent,
  useOrgStudents,
  useRegenerateStudentCode,
} from '../hooks';
import { useManagerStore } from '../store/manager-store';

const APP_DOWNLOAD_URL = 'https://privatedu.app';
const PAGE_LIMIT = 20;
const DEBOUNCE_MS = 300;

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

function StudentRow({ student, onPress, onLongPress }: {
  student: OrgStudent;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { t } = useTranslation();
  const tone = useMonogramTone(student.id);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={student.name}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        backgroundColor: pressed ? colors.neutral.cardWarm : colors.neutral.card,
        borderWidth: 1.5,
        borderColor: colors.neutral.rule,
        borderRadius: 18,
      })}
    >
      <Monogram name={student.name} tone={tone} size={44} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.neutral.ink, letterSpacing: -0.1 }}>
          {student.name}
        </Text>
        <Text style={{ fontSize: 12, color: colors.neutral.inkMuted, fontWeight: '500' }}>
          {student.gradeLevel
            ? `${student.gradeLevel}${student.assignedSessionsCount !== undefined ? ` · ${t('manager.students.sessionsCount', { count: student.assignedSessionsCount })}` : ''}`
            : t('manager.students.noGrade')}
        </Text>
      </View>
      <Ionicons
        name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
        size={16}
        color={colors.neutral.inkMuted}
      />
    </Pressable>
  );
}

function ActionRow({ icon, label, onPress, color = colors.neutral.ink, danger = false }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderTopWidth: danger ? 1 : 0,
        borderTopColor: colors.neutral.rule,
        backgroundColor: pressed ? (danger ? colors.semantic.absentSoft : colors.neutral.cardWarm) : 'transparent',
      })}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color }}>{label}</Text>
      <Ionicons
        name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
        size={16}
        color={colors.neutral.inkMuted}
      />
    </Pressable>
  );
}

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
    if (debounceRef.current !== null)
      clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(text);
      setPage(1);
    }, DEBOUNCE_MS);
  }, []);

  const handleStudentPress = (student: OrgStudent) => router.push(AppRoute.manager.studentDetail(student.id));
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
    if (await Linking.canOpenURL(url)) {
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
            deleteMutation.mutate(selectedStudent.id, {
              onError: error => Alert.alert(
                t('manager.students.actionErrorTitle', { defaultValue: 'Action failed' }),
                getApiErrorMessage(error, t('manager.students.deleteError', { defaultValue: 'Could not delete this student. Please try again.' })),
              ),
            });
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
            regenerateMutation.mutate(selectedStudent.id, {
              onError: error => Alert.alert(
                t('manager.students.actionErrorTitle', { defaultValue: 'Action failed' }),
                getApiErrorMessage(error, t('manager.students.regenerateError', { defaultValue: 'Could not regenerate the code. Please try again.' })),
              ),
            });
          },
        },
      ],
    );
  };

  if (studentsQuery.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (studentsQuery.isError) {
    return (
      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
        <Ionicons name="alert-circle-outline" size={32} color={colors.semantic.absent} />
        <Text style={{ fontSize: 13, color: colors.semantic.absent }}>
          {t('manager.students.errorLoading')}
        </Text>
        <Button variant="outline" size="sm" label={t('manager.students.errorRetry')} fullWidth={false} onPress={() => studentsQuery.refetch()} />
      </View>
    );
  }

  const students = studentsQuery.data?.data ?? [];

  return (
    <>
      {/* Search + grade filter */}
      <View style={{ gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}>
        <Input
          label={t('manager.students.search')}
          value={searchInput}
          onChangeText={handleSearchChange}
        />
        <Pressable
          onPress={gradePicker.present}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 13,
            backgroundColor: pressed ? colors.neutral.cardWarm : colors.neutral.card,
            borderWidth: 1.5,
            borderColor: colors.neutral.rule,
            borderRadius: 14,
          })}
        >
          <Text style={{ fontSize: 14, color: colors.neutral.ink, fontWeight: '600' }}>
            {gradeOptions.find(o => o.value === gradeLevel)?.label ?? t('manager.students.grades.label', { defaultValue: 'All grades' })}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.neutral.inkMuted} />
        </Pressable>
      </View>

      {/* Roster rows */}
      <View style={{ paddingHorizontal: 16, gap: 8 }}>
        {students.length === 0
          ? (
              <EmptyState
                title={t('manager.students.empty', { defaultValue: 'No students yet' })}
                body={t('manager.students.emptyHint', { defaultValue: 'Add your first student to get started.' })}
              />
            )
          : students.map(student => (
              <StudentRow
                key={student.id}
                student={student}
                onPress={() => handleStudentPress(student)}
                onLongPress={() => handleStudentLongPress(student)}
              />
            ))}
      </View>

      {/* Pagination */}
      {totalPages > 1 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16 }}>
          <Button variant="outline" size="sm" label={t('manager.students.prevPage')} fullWidth={false} disabled={page <= 1} onPress={() => setPage(p => Math.max(1, p - 1))} />
          <Text style={{ fontSize: 13, color: colors.neutral.inkMuted }}>
            {t('manager.students.pageInfo', { page, total: totalPages })}
          </Text>
          <Button variant="outline" size="sm" label={t('manager.students.nextPage')} fullWidth={false} disabled={page >= totalPages} onPress={() => setPage(p => Math.min(totalPages, p + 1))} />
        </View>
      )}

      {/* Actions sheet */}
      <Modal ref={actionsSheet.ref} snapPoints={['55%']} title={selectedStudent?.name ?? ''}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 32, gap: 8 }}>
          <View style={{ backgroundColor: colors.neutral.cardWarm, borderRadius: 14, padding: 16, alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text style={{ fontSize: 10, color: colors.neutral.inkMuted, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {t('manager.students.connectionCode')}
            </Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.neutral.ink, letterSpacing: 4, textAlign: 'center' }}>
              {selectedStudent?.connectionCode}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <Pressable
                onPress={handleCopy}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: pressed ? colors.neutral.rule : colors.neutral.card,
                  borderWidth: 1,
                  borderColor: colors.neutral.rule,
                })}
              >
                <Ionicons name="copy-outline" size={14} color={colors.neutral.ink} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.neutral.ink }}>
                  {t('manager.students.actions.copy')}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleWhatsApp}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: pressed ? '#D1FAE5' : '#F0FDF4',
                  borderWidth: 1,
                  borderColor: '#BBF7D0',
                })}
              >
                <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#15803D' }}>
                  {t('manager.whatsapp.share', { defaultValue: 'WhatsApp' })}
                </Text>
              </Pressable>
            </View>
          </View>
          <ActionRow
            icon="refresh-outline"
            label={t('manager.students.actions.regenerate')}
            onPress={handleRegenerate}
            color={colors.semantic.excused}
          />
          <ActionRow
            icon="trash-outline"
            label={t('manager.students.actions.delete')}
            onPress={handleDelete}
            color={colors.semantic.absent}
            danger
          />
        </View>
      </Modal>

      <OptionPickerSheet
        ref={gradePicker.ref}
        title={t('manager.students.gradeFilter', { defaultValue: 'Filter by grade' })}
        options={gradeOptions}
        value={gradeLevel}
        onSelect={(val) => {
          setGradeLevel(String(val));
          setPage(1);
        }}
      />
    </>
  );
}

export function StudentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const studentsListQuery = useOrgStudents(activeOrgId);
  const totalCount = studentsListQuery.data?.meta?.total ?? 0;
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const handlePullRefresh = useCallback(async () => {
    setIsManualRefresh(true);
    try {
      await studentsListQuery.refetch();
    }
    finally {
      setIsManualRefresh(false);
    }
  }, [studentsListQuery]);

  if (!activeOrgId) {
    return <NoOrgEmptyState />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral.paper }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: colors.neutral.inkMuted, fontWeight: '500' }}>
            {t('manager.students.countLabel', { count: totalCount, defaultValue: '{{count}} students' })}
          </Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.neutral.ink, letterSpacing: -0.5, marginTop: 2 }}>
            {t('manager.students.title', { defaultValue: 'Roster' })}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push(AppRoute.manager.studentCreate)}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: pressed ? colors.brand.primaryDeep : colors.brand.primary,
            alignItems: 'center',
            justifyContent: 'center',
          })}
          accessibilityLabel={t('manager.students.actions.create', { defaultValue: 'Add student' })}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={24} color={colors.neutral.ink} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 80, paddingTop: 4 }}
        refreshControl={(
          <RefreshControl
            refreshing={isManualRefresh}
            onRefresh={handlePullRefresh}
          />
        )}
      >
        <StudentListSection />
      </ScrollView>
    </View>
  );
}
