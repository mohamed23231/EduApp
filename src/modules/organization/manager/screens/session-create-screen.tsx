import type { OrgMember, OrgStudent } from '../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, I18nManager, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Input,
  OptionPickerSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
} from '@/components/ui';
import { useModal } from '@/components/ui/modal';
import { TimePickerSheet } from '@/modules/teacher/components/time-picker-sheet';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import { LimitReachedError, NoOrgEmptyState, OrgStudentSelectSheet } from '../components';
import {
  useCreateSession,
  useOrganization,
  useOrgMembers,
  useOrgStudents,
} from '../hooks';
import { useManagerStore } from '../store/manager-store';
import { createSessionSchema } from '../validators';

const DAY_OPTIONS = [
  { key: 'mon', value: 1 },
  { key: 'tue', value: 2 },
  { key: 'wed', value: 3 },
  { key: 'thu', value: 4 },
  { key: 'fri', value: 5 },
  { key: 'sat', value: 6 },
  { key: 'sun', value: 7 },
] as const;

type CreateFormValues = {
  subject: string;
  time: string;
  durationMinutes: number;
  assignedMemberId: string;
  daysOfWeek: number[];
  studentIds: string[];
};

function sortedMembers(members: OrgMember[]): OrgMember[] {
  return [...members].sort((a, b) => {
    if (a.role === 'OWNER' && b.role !== 'OWNER')
      return -1;
    if (a.role !== 'OWNER' && b.role === 'OWNER')
      return 1;
    return 0;
  });
}

function DayChip({
  dayKey,
  selected,
  onToggle,
}: {
  dayKey: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const dayLabel = t(`manager.days.${dayKey}`, { defaultValue: dayKey });
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      className={`rounded-full px-4 py-2 ${selected ? 'bg-[#2563EB]' : 'bg-[#EFF6FF]'}`}
    >
      <Text className={`font-inter text-sm ${selected ? 'text-white' : 'text-[#3B82F6]'}`}>
        {dayLabel}
      </Text>
    </Pressable>
  );
}

function SelectButton({
  icon,
  placeholder,
  value,
  badge,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value?: string;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.selectBtn, pressed && styles.selectBtnPressed]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={18} color={value ? '#111827' : '#9CA3AF'} />
      <Text style={[styles.selectBtnText, !value && styles.selectBtnPlaceholder]} numberOfLines={1}>
        {value || placeholder}
      </Text>
      {badge !== undefined && badge > 0
        ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )
        : null}
      <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
    </Pressable>
  );
}

function useCreateFormState({
  members,
}: {
  members: OrgMember[];
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const createMutation = useCreateSession(activeOrgId);
  const [error, setError] = useState<string | null>(null);
  const defaultMemberId = members[0]?.id ?? '';
  const [values, setValues] = useState<CreateFormValues>({
    subject: '',
    time: '14:00',
    durationMinutes: 90,
    assignedMemberId: defaultMemberId,
    daysOfWeek: [1],
    studentIds: [],
  });

  const effectiveMemberId = values.assignedMemberId || defaultMemberId;
  const formValues = useMemo<CreateFormValues>(
    () => ({ ...values, assignedMemberId: effectiveMemberId }),
    [values, effectiveMemberId],
  );

  const toggleDay = (dayValue: number) => {
    setValues(c => ({
      ...c,
      daysOfWeek: c.daysOfWeek.includes(dayValue)
        ? c.daysOfWeek.filter(v => v !== dayValue)
        : [...c.daysOfWeek, dayValue].sort(),
    }));
  };

  const submit = async () => {
    const parsed = createSessionSchema.safeParse(formValues);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? null);
      return;
    }
    try {
      await createMutation.mutateAsync(parsed.data);
      setError(null);
      Alert.alert(
        t('manager.sessions.createScreenTitle', { defaultValue: 'Create Session' }),
        t('manager.sessions.createSuccess', { defaultValue: 'Session created successfully.' }),
      );
      router.back();
    }
    catch (cause) {
      setError(
        getApiErrorMessage(
          cause,
          t('manager.sessions.submitError', { defaultValue: 'Unable to save the session right now.' }),
        ),
      );
    }
  };

  return {
    values,
    setValues,
    formValues,
    error,
    isPending: createMutation.isPending,
    toggleDay,
    submit,
  };
}

// eslint-disable-next-line max-lines-per-function
function CreateForm({
  members,
  students,
  limitMessage,
}: {
  members: OrgMember[];
  students: OrgStudent[];
  limitMessage: string | null;
}) {
  const { t } = useTranslation();
  const form = useCreateFormState({ members });
  const timePicker = useModal();
  const teacherPicker = useModal();
  const studentPicker = useModal();

  const teacherOptions = useMemo(
    () => members.map(m => ({
      label: m.name + (m.role === 'OWNER' ? ` (${t('manager.sessions.myselfSuffix', { defaultValue: 'Myself' })})` : ''),
      value: m.id,
    })),
    [members, t],
  );

  const selectedMemberName = useMemo(() => {
    const member = members.find(m => m.id === form.formValues.assignedMemberId);
    if (!member)
      return '';
    return member.name + (member.role === 'OWNER' ? ` (${t('manager.sessions.myselfSuffix', { defaultValue: 'Myself' })})` : '');
  }, [members, form.formValues.assignedMemberId, t]);

  const selectedStudentNames = useMemo(
    () => students
      .filter(s => form.values.studentIds.includes(s.id))
      .map(s => s.name)
      .join(', '),
    [students, form.values.studentIds],
  );

  return (
    <>
      <ScrollView contentContainerClassName="px-6 pb-12 pt-4" keyboardShouldPersistTaps="handled">
        <Input
          label={t('manager.sessions.fields.subject', { defaultValue: 'Subject' })}
          value={form.values.subject}
          onChangeText={subject => form.setValues(c => ({ ...c, subject }))}
        />
        <Input
          label={t('manager.sessions.fields.duration', { defaultValue: 'Duration (minutes)' })}
          value={String(form.values.durationMinutes)}
          onChangeText={dm => form.setValues(c => ({ ...c, durationMinutes: Number(dm) || 0 }))}
          keyboardType="numeric"
        />

        <Text className="font-inter mt-4 text-sm font-semibold text-slate-700">
          {t('manager.sessions.fields.time', { defaultValue: 'Time' })}
        </Text>
        <View className="mt-2">
          <SelectButton
            icon="time-outline"
            placeholder="HH:MM"
            value={form.values.time}
            onPress={timePicker.present}
          />
        </View>

        <Text className="font-inter mt-4 text-sm font-semibold text-slate-700">
          {t('manager.sessions.fields.days', { defaultValue: 'Days of week' })}
        </Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {DAY_OPTIONS.map(day => (
            <DayChip
              key={day.value}
              dayKey={day.key}
              selected={form.values.daysOfWeek.includes(day.value)}
              onToggle={() => form.toggleDay(day.value)}
            />
          ))}
        </View>

        <Text className="font-inter mt-5 text-sm font-semibold text-slate-700">
          {t('manager.sessions.fields.teacher', { defaultValue: 'Assigned teacher' })}
        </Text>
        <View className="mt-2">
          <SelectButton
            icon="person-outline"
            placeholder={t('manager.sessions.selectTeacher', { defaultValue: 'Select teacher' })}
            value={selectedMemberName}
            onPress={teacherPicker.present}
          />
        </View>

        <Text className="font-inter mt-5 text-sm font-semibold text-slate-700">
          {t('manager.sessions.fields.students', { defaultValue: 'Assigned students' })}
        </Text>
        <View className="mt-2">
          <SelectButton
            icon="people-outline"
            placeholder={t('manager.sessions.selectStudentsPlaceholder', { defaultValue: 'Select students' })}
            value={form.values.studentIds.length > 0 ? selectedStudentNames : ''}
            badge={form.values.studentIds.length}
            onPress={studentPicker.present}
          />
        </View>

        <LimitReachedError message={form.error ?? limitMessage} />

        <Button
          className="mt-6"
          label={t('manager.sessions.actions.create', { defaultValue: 'Create session' })}
          onPress={form.submit}
          loading={form.isPending}
        />
      </ScrollView>

      <TimePickerSheet
        ref={timePicker.ref}
        value={form.values.time}
        onChange={time => form.setValues(c => ({ ...c, time }))}
      />
      <OptionPickerSheet
        ref={teacherPicker.ref}
        title={t('manager.sessions.fields.teacher', { defaultValue: 'Assigned teacher' })}
        options={teacherOptions}
        value={form.formValues.assignedMemberId}
        onSelect={id => form.setValues(c => ({ ...c, assignedMemberId: String(id) }))}
      />
      <OrgStudentSelectSheet
        ref={studentPicker.ref}
        students={students}
        selectedIds={form.values.studentIds}
        onConfirm={ids => form.setValues(c => ({ ...c, studentIds: ids }))}
      />
    </>
  );
}

export function SessionCreateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const membersQuery = useOrgMembers(activeOrgId);
  const studentsQuery = useOrgStudents(activeOrgId);
  const organizationQuery = useOrganization(activeOrgId);

  const orderedMembers = useMemo(
    () => sortedMembers(membersQuery.data?.data ?? []),
    [membersQuery.data?.data],
  );

  const limitMessage = useMemo(() => {
    const organization = organizationQuery.data;
    const limit = organization?.limits?.maxSessions;
    if (!organization || limit === null || limit === undefined)
      return null;
    if (organization.currentSessions < limit)
      return null;
    return t('manager.limits.sessions', {
      defaultValue: 'Session limit reached ({{current}}/{{limit}}).',
      current: organization.currentSessions,
      limit,
    });
  }, [organizationQuery.data, t]);

  const isLoading = membersQuery.isLoading || studentsQuery.isLoading;

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <View className="flex-row items-center gap-3 px-6 pt-4 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="size-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons
            name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'}
            size={20}
            color="#0F172A"
          />
        </Pressable>
        <Text className="font-inter flex-1 text-xl font-semibold text-slate-900">
          {t('manager.sessions.createScreenTitle', { defaultValue: 'Create Session' })}
        </Text>
      </View>

      {!activeOrgId
        ? (
            <NoOrgEmptyState />
          )
        : isLoading
          ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
              </View>
            )
          : (
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
              >
                <CreateForm
                  members={orderedMembers}
                  students={studentsQuery.data?.data ?? []}
                  limitMessage={limitMessage}
                />
              </KeyboardAvoidingView>
            )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectBtnPressed: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  selectBtnText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  selectBtnPlaceholder: {
    color: '#9CA3AF',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
