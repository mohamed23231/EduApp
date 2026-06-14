import type { OrgMember, OrgStudent } from '../types/manager.types';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Input,
  OptionPickerSheet,
  ScrollView,
  Text,
  TopBar,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { useModal } from '@/components/ui/modal';
import { TimePickerSheet } from '@/modules/teacher/components/time-picker-sheet';
import { LimitReachedError, NoOrgEmptyState, OrgStudentSelectSheet } from '../components';
import { DayChip } from '../components/session-create/day-chip';
import { SelectButton } from '../components/session-create/select-button';
import {
  useOrganization,
  useOrgMembers,
  useOrgStudents,
} from '../hooks';
import { useCreateSessionForm } from '../hooks/use-create-session-form';
import { useManagerStore } from '../store/manager-store';

const DAY_OPTIONS = [
  { key: 'mon', value: 1 },
  { key: 'tue', value: 2 },
  { key: 'wed', value: 3 },
  { key: 'thu', value: 4 },
  { key: 'fri', value: 5 },
  { key: 'sat', value: 6 },
  { key: 'sun', value: 7 },
] as const;

function sortedMembers(members: OrgMember[]): OrgMember[] {
  return [...members].sort((a, b) => {
    if (a.role === 'OWNER' && b.role !== 'OWNER')
      return -1;
    if (a.role !== 'OWNER' && b.role === 'OWNER')
      return 1;
    return 0;
  });
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
  const form = useCreateSessionForm({ members });
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
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
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

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral.inkMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {t('manager.sessions.fields.time', { defaultValue: 'Time' })}
          </Text>
          <SelectButton
            icon="time-outline"
            placeholder="HH:MM"
            value={form.values.time}
            onPress={timePicker.present}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral.inkMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {t('manager.sessions.fields.days', { defaultValue: 'Days of week' })}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {DAY_OPTIONS.map(day => (
              <DayChip
                key={day.value}
                dayKey={day.key}
                selected={form.values.daysOfWeek.includes(day.value)}
                onToggle={() => form.toggleDay(day.value)}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral.inkMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {t('manager.sessions.fields.teacher', { defaultValue: 'Assigned teacher' })}
          </Text>
          <SelectButton
            icon="person-outline"
            placeholder={t('manager.sessions.selectTeacher', { defaultValue: 'Select teacher' })}
            value={selectedMemberName}
            onPress={teacherPicker.present}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral.inkMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            {t('manager.sessions.fields.students', { defaultValue: 'Assigned students' })}
          </Text>
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

  if (!activeOrgId) {
    return <NoOrgEmptyState />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral.paper }}>
      <TopBar
        title={t('manager.sessions.createScreenTitle', { defaultValue: 'Create Session' })}
        onBack={() => router.back()}
      />
      {isLoading
        ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={colors.brand.primary} />
            </View>
          )
        : (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <CreateForm
                members={orderedMembers}
                students={studentsQuery.data?.data ?? []}
                limitMessage={limitMessage}
              />
            </KeyboardAvoidingView>
          )}
    </View>
  );
}
