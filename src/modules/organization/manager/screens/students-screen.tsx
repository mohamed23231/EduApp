import type { OrgStudent } from '../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Input,
  SafeAreaView,
  ScrollView,
  Select,
  Text,
  View,
} from '@/components/ui';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import { LimitReachedError, WhatsAppShareButton } from '../components';
import {
  useCreateStudent,
  useDeleteStudent,
  useOrganization,
  useOrgStudents,
  useRegenerateStudentCode,
  useUpdateStudent,
} from '../hooks';
import { useManagerStore } from '../store/manager-store';
import { createStudentSchema } from '../validators';

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

function StudentCard({
  student,
  onEdit,
  onDelete,
  onRegenerate,
}: {
  student: OrgStudent;
  onEdit: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View className="rounded-2xl border border-slate-200 p-4">
      <View className="flex-row items-center gap-2">
        <Text className="font-inter flex-1 text-base font-semibold text-slate-900">
          {student.name}
        </Text>
        {student.hasParentLinked
          ? (
              <View className="flex-row items-center gap-1 rounded-full bg-emerald-50 px-2 py-1">
                <Ionicons name="link" size={12} color="#059669" />
                <Text className="font-inter text-xs font-medium text-emerald-700">
                  {t('manager.students.parentLinked')}
                </Text>
              </View>
            )
          : null}
      </View>
      <View className="mt-1 flex-row items-center gap-3">
        <Text className="font-inter text-sm text-slate-500">
          {student.gradeLevel || t('manager.students.noGrade')}
        </Text>
        {student.assignedSessionsCount !== undefined
          ? (
              <Text className="font-inter text-sm text-slate-500">
                {t('manager.students.sessionsCount', { count: student.assignedSessionsCount })}
              </Text>
            )
          : null}
      </View>
      <Text className="font-inter mt-3 text-xs tracking-[1.2px] text-slate-400 uppercase">
        {t('manager.students.connectionCode')}
      </Text>
      <Text className="font-inter mt-1 text-2xl font-semibold text-slate-900">
        {student.connectionCode}
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-3">
        <Button
          variant="outline"
          label={t('manager.students.actions.copy')}
          fullWidth={false}
          onPress={async () => {
            await Clipboard.setStringAsync(student.connectionCode);
            Alert.alert(t('manager.students.copiedTitle'), t('manager.students.copiedBody'));
          }}
        />
        <WhatsAppShareButton message={`${student.name} - ${student.connectionCode}\n${APP_DOWNLOAD_URL}`} />
      </View>
      <View className="mt-3 flex-row flex-wrap gap-3">
        <Button variant="ghost" label={t('manager.students.actions.edit')} fullWidth={false} onPress={onEdit} />
        <Button variant="ghost" label={t('manager.students.actions.regenerate')} fullWidth={false} onPress={onRegenerate} />
        <Button variant="destructive" size="sm" label={t('manager.students.actions.delete')} fullWidth={false} onPress={onDelete} />
      </View>
    </View>
  );
}

function StudentCreateForm({
  limitMessage,
}: {
  limitMessage: string | null;
}) {
  const { t } = useTranslation();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const createMutation = useCreateStudent(activeOrgId);
  const updateMutation = useUpdateStudent(activeOrgId);
  const [editingStudent, setEditingStudent] = useState<OrgStudent | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [values, setValues] = useState({
    name: '',
    gradeLevel: '',
    notes: '',
    parentPhone: '',
  });

  const resetForm = () => {
    setValues({ name: '', gradeLevel: '', notes: '', parentPhone: '' });
    setEditingStudent(null);
    setFormError(null);
  };

  const submit = async () => {
    const parsed = createStudentSchema.safeParse(values);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? null);
      return;
    }
    try {
      if (editingStudent) {
        await updateMutation.mutateAsync({ studentId: editingStudent.id, input: parsed.data });
      }
      else {
        await createMutation.mutateAsync(parsed.data);
      }
      resetForm();
    }
    catch (error) {
      setFormError(getApiErrorMessage(error, t('manager.students.submitError')));
    }
  };

  return (
    <View className="mt-5 rounded-[28px] bg-white p-5">
      <Text className="font-inter text-lg font-semibold text-slate-900">
        {editingStudent
          ? t('manager.students.editTitle')
          : t('manager.students.createTitle')}
      </Text>
      <Input label={t('manager.students.fields.name')} value={values.name} onChangeText={name => setValues(c => ({ ...c, name }))} />
      <Input label={t('manager.students.fields.gradeLevel')} value={values.gradeLevel} onChangeText={gl => setValues(c => ({ ...c, gradeLevel: gl }))} />
      <Input label={t('manager.students.fields.parentPhone')} value={values.parentPhone} onChangeText={pp => setValues(c => ({ ...c, parentPhone: pp }))} />
      <Input label={t('manager.students.fields.notes')} value={values.notes} onChangeText={notes => setValues(c => ({ ...c, notes }))} multiline />
      <LimitReachedError message={formError ?? limitMessage} />
      <View className="mt-3 flex-row gap-3">
        <Button
          label={editingStudent
            ? t('manager.students.actions.save')
            : t('manager.students.actions.create')}
          onPress={submit}
          loading={createMutation.isPending || updateMutation.isPending}
        />
        {editingStudent
          ? <Button variant="outline" label={t('manager.common.cancel')} onPress={resetForm} />
          : null}
      </View>
    </View>
  );
}

const DEBOUNCE_MS = 300;

function StudentListSection() {
  const { t } = useTranslation();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const deleteMutation = useDeleteStudent(activeOrgId);
  const regenerateMutation = useRegenerateStudentCode(activeOrgId);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const studentsQuery = useOrgStudents(activeOrgId, { search, gradeLevel, page, limit: PAGE_LIMIT });

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const gradeOptions = useMemo(
    () => GRADE_KEYS.map(key => ({
      label: t(`manager.students.grades.${key}`),
      value: key === 'all'
        ? ''
        : key,
    })),
    [t],
  );

  const totalPages = useMemo(() => {
    const total = studentsQuery.data?.meta?.total ?? 0;
    return Math.max(1, Math.ceil(total / PAGE_LIMIT));
  }, [studentsQuery.data?.meta?.total]);

  const confirmDelete = (student: OrgStudent) => {
    Alert.alert(
      t('manager.students.deleteTitle'),
      t('manager.students.deleteMessage'),
      [
        { text: t('manager.common.cancel'), style: 'cancel' },
        { text: t('manager.students.deleteConfirm'), style: 'destructive', onPress: () => deleteMutation.mutate(student.id) },
      ],
    );
  };

  const handleGradeChange = (val: string | number) => {
    setGradeLevel(String(val));
    setPage(1);
  };

  const handleSearchChange = (text: string) => {
    setSearchInput(text);
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setSearch(text);
      setPage(1);
    }, DEBOUNCE_MS);
  };

  return (
    <View className="mt-5 rounded-[28px] bg-white p-5">
      <Input label={t('manager.students.search')} value={searchInput} onChangeText={handleSearchChange} />
      <Select label={t('manager.students.gradeFilter')} placeholder={t('manager.students.grades.label')} value={gradeLevel} options={gradeOptions} onSelect={handleGradeChange} />

      {studentsQuery.isLoading
        ? (
            <View className="mt-6 items-center py-10">
              <ActivityIndicator size="large" color="#6366F1" />
            </View>
          )
        : null}

      {studentsQuery.isError && !studentsQuery.isLoading
        ? (
            <View className="mt-6 items-center gap-3 py-6">
              <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
              <Text className="font-inter text-sm text-red-600">{t('manager.students.errorLoading')}</Text>
              <Button variant="outline" size="sm" label={t('manager.students.errorRetry')} fullWidth={false} onPress={() => studentsQuery.refetch()} />
            </View>
          )
        : null}

      {!studentsQuery.isLoading && !studentsQuery.isError
        ? (
            <View className="mt-4 gap-3">
              {(studentsQuery.data?.data ?? []).map(student => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onEdit={() => {}}
                  onDelete={() => confirmDelete(student)}
                  onRegenerate={() => regenerateMutation.mutate(student.id)}
                />
              ))}
              {studentsQuery.data && studentsQuery.data.data.length === 0
                ? <Text className="font-inter text-sm text-slate-500">{t('manager.students.empty')}</Text>
                : null}

              {totalPages > 1
                ? (
                    <View className="mt-4 flex-row items-center justify-between">
                      <Button variant="outline" size="sm" label={t('manager.students.prevPage')} fullWidth={false} disabled={page <= 1} onPress={() => setPage(p => Math.max(1, p - 1))} />
                      <Text className="font-inter text-sm text-slate-500">{t('manager.students.pageInfo', { page, total: totalPages })}</Text>
                      <Button variant="outline" size="sm" label={t('manager.students.nextPage')} fullWidth={false} disabled={page >= totalPages} onPress={() => setPage(p => Math.min(totalPages, p + 1))} />
                    </View>
                  )
                : null}
            </View>
          )
        : null}
    </View>
  );
}

export function StudentsScreen() {
  const { t } = useTranslation();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const organizationQuery = useOrganization(activeOrgId);
  const studentsListQuery = useOrgStudents(activeOrgId);

  const limitMessage = useMemo(() => {
    const organization = organizationQuery.data;
    const limit = organization?.limits?.maxStudents;
    if (!organization || limit === null || limit === undefined)
      return null;
    if (organization.currentStudents < limit)
      return null;
    return t('manager.limits.students', { current: organization.currentStudents, limit });
  }, [organizationQuery.data, t]);

  const onRefresh = useCallback(() => {
    organizationQuery.refetch();
    studentsListQuery.refetch();
  }, [organizationQuery, studentsListQuery]);

  const isRefreshing = organizationQuery.isRefetching || studentsListQuery.isRefetching;

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1e8]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="px-6 py-6"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
          <Text className="font-inter text-3xl font-semibold text-slate-900">
            {t('manager.students.title')}
          </Text>
          <Text className="font-inter mt-2 text-base text-slate-500">
            {t('manager.students.subtitle')}
          </Text>
          <StudentCreateForm limitMessage={limitMessage} />
          <StudentListSection />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
