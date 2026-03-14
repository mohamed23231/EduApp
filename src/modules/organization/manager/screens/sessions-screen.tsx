import type { OrgMember, OrgSessionTemplate, OrgStudent } from '../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Input,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import { LimitReachedError } from '../components';
import {
  useCreateSession,
  useDeleteSession,
  useOrganization,
  useOrganizations,
  useOrgMembers,
  useOrgSessions,
  useOrgStudents,
  usePauseResumeSession,
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

function formatDaysOfWeek(
  days: number[],
  t: (key: string) => string,
): string {
  const map: Record<number, string> = {
    1: t('manager.days.mon'),
    2: t('manager.days.tue'),
    3: t('manager.days.wed'),
    4: t('manager.days.thu'),
    5: t('manager.days.fri'),
    6: t('manager.days.sat'),
    7: t('manager.days.sun'),
  };
  return days
    .slice()
    .sort()
    .map(d => map[d] ?? '')
    .filter(Boolean)
    .join(', ');
}

function sortedMembers(members: OrgMember[]): OrgMember[] {
  return [...members].sort((a, b) => {
    if (a.role === 'OWNER' && b.role !== 'OWNER')
      return -1;
    if (a.role !== 'OWNER' && b.role === 'OWNER')
      return 1;
    return 0;
  });
}

function SessionCard({
  session,
  onDetails,
  onPauseResume,
  onDelete,
}: {
  session: OrgSessionTemplate;
  onDetails: () => void;
  onPauseResume: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View
      className={`rounded-2xl border p-4 ${
        session.isPaused
          ? 'border-amber-300 bg-amber-50/50'
          : 'border-slate-200'
      }`}
    >
      <View className="flex-row items-center gap-2">
        <Text className="font-inter flex-1 text-base font-semibold text-slate-900">
          {session.subject}
        </Text>
        {session.isPaused
          ? (
              <View className="rounded-full bg-amber-100 px-2 py-1">
                <Text className="font-inter text-xs font-medium text-amber-700">
                  {t('manager.sessions.paused')}
                </Text>
              </View>
            )
          : null}
      </View>
      <Text className="font-inter mt-1 text-sm text-slate-500">
        {session.time}
        {' '}
        {'\u00B7'}
        {' '}
        {session.assignedMember.name}
      </Text>
      <Text className="font-inter mt-1 text-sm text-slate-500">
        {formatDaysOfWeek(session.daysOfWeek, t)}
      </Text>
      <Text className="font-inter mt-1 text-sm text-slate-500">
        {t('manager.sessions.studentCount', {
          count: session.studentCount ?? session.students?.length ?? 0,
        })}
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-3">
        <Button variant="outline" label={t('manager.sessions.actions.details')} fullWidth={false} onPress={onDetails} />
        <Button
          variant="ghost"
          label={
            session.isPaused
              ? t('manager.sessions.actions.resume')
              : t('manager.sessions.actions.pause')
          }
          fullWidth={false}
          onPress={onPauseResume}
        />
        <Button variant="destructive" size="sm" label={t('manager.sessions.actions.delete')} fullWidth={false} onPress={onDelete} />
      </View>
    </View>
  );
}

type CreateFormValues = {
  subject: string;
  time: string;
  durationMinutes: number;
  assignedMemberId: string;
  daysOfWeek: number[];
  studentIds: string[];
};

function CreateSessionForm({
  members,
  students,
  limitMessage,
}: {
  members: OrgMember[];
  students: OrgStudent[];
  limitMessage: string | null;
}) {
  const { t } = useTranslation();
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

  // Derive assignedMemberId once members load. useMemo avoids the
  // "setState in useEffect" cascade the linter flags.
  const effectiveMemberId = values.assignedMemberId || defaultMemberId;
  const formValues = useMemo<CreateFormValues>(
    () => ({ ...values, assignedMemberId: effectiveMemberId }),
    [values, effectiveMemberId],
  );

  const submit = async () => {
    const parsed = createSessionSchema.safeParse(formValues);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? null);
      return;
    }
    try {
      await createMutation.mutateAsync(parsed.data);
      setValues({
        subject: '',
        time: '14:00',
        durationMinutes: 90,
        assignedMemberId: defaultMemberId,
        daysOfWeek: [1],
        studentIds: [],
      });
      setError(null);
    }
    catch (cause) {
      setError(getApiErrorMessage(cause, t('manager.sessions.submitError')));
    }
  };

  return (
    <View className="mt-5 rounded-[28px] bg-white p-5">
      <Text className="font-inter text-lg font-semibold text-slate-900">
        {t('manager.sessions.createTitle')}
      </Text>
      <Input label={t('manager.sessions.fields.subject')} value={values.subject} onChangeText={subject => setValues(c => ({ ...c, subject }))} />
      <Input label={t('manager.sessions.fields.time')} value={values.time} onChangeText={time => setValues(c => ({ ...c, time }))} />
      <Input label={t('manager.sessions.fields.duration')} value={String(values.durationMinutes)} onChangeText={dm => setValues(c => ({ ...c, durationMinutes: Number(dm) || 0 }))} keyboardType="numeric" />

      <Text className="font-inter mt-3 text-sm font-semibold text-slate-700">
        {t('manager.sessions.fields.days')}
      </Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {DAY_OPTIONS.map(day => (
          <DayChip key={day.value} dayKey={day.key} selected={values.daysOfWeek.includes(day.value)} onToggle={() => setValues(c => ({ ...c, daysOfWeek: c.daysOfWeek.includes(day.value) ? c.daysOfWeek.filter(v => v !== day.value) : [...c.daysOfWeek, day.value].sort() }))} />
        ))}
      </View>

      <Text className="font-inter mt-4 text-sm font-semibold text-slate-700">
        {t('manager.sessions.fields.teacher')}
      </Text>
      <View className="mt-2 gap-2">
        {members.map(member => (
          <MemberChip key={member.id} member={member} selected={values.assignedMemberId === member.id} onPress={() => setValues(c => ({ ...c, assignedMemberId: member.id }))} />
        ))}
      </View>

      <Text className="font-inter mt-4 text-sm font-semibold text-slate-700">
        {t('manager.sessions.fields.students')}
      </Text>
      <View className="mt-2 gap-2">
        {students.map(student => (
          <StudentChip key={student.id} name={student.name} selected={values.studentIds.includes(student.id)} onPress={() => setValues(c => ({ ...c, studentIds: c.studentIds.includes(student.id) ? c.studentIds.filter(v => v !== student.id) : [...c.studentIds, student.id] }))} />
        ))}
      </View>

      <LimitReachedError message={error ?? limitMessage} />
      <Button className="mt-4" label={t('manager.sessions.actions.create')} onPress={submit} loading={createMutation.isPending} />
    </View>
  );
}

function DayChip({ dayKey, selected, onToggle }: { dayKey: string; selected: boolean; onToggle: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable onPress={onToggle} className={`rounded-full px-4 py-2 ${selected ? 'bg-slate-900' : 'bg-slate-100'}`}>
      <Text className={`font-inter text-sm ${selected ? 'text-white' : 'text-slate-700'}`}>
        {t(`manager.days.${dayKey}`)}
      </Text>
    </Pressable>
  );
}

function MemberChip({ member, selected, onPress }: { member: OrgMember; selected: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable onPress={onPress} className={`rounded-2xl border px-4 py-3 ${selected ? 'border-slate-900 bg-slate-900' : 'border-slate-200 bg-white'}`}>
      <Text className={`font-inter text-sm ${selected ? 'text-white' : 'text-slate-700'}`}>
        {member.name}
        {' '}
        {member.role === 'OWNER' ? t('manager.sessions.myselfSuffix') : ''}
      </Text>
    </Pressable>
  );
}

function StudentChip({ name, selected, onPress }: { name: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`rounded-2xl border px-4 py-3 ${selected ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <Text className="font-inter text-sm text-slate-700">{name}</Text>
    </Pressable>
  );
}

function SessionTemplatesList() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const sessionsQuery = useOrgSessions(activeOrgId);
  const deleteMutation = useDeleteSession(activeOrgId);
  const pauseResumeMutation = usePauseResumeSession(activeOrgId);

  const confirmDelete = (session: OrgSessionTemplate) => {
    Alert.alert(
      t('manager.sessions.deleteTitle'),
      t('manager.sessions.deleteMessage'),
      [
        { text: t('manager.common.cancel'), style: 'cancel' },
        {
          text: t('manager.sessions.deleteConfirm'),
          style: 'destructive',
          onPress: () => deleteMutation.mutate(session.id),
        },
      ],
    );
  };

  return (
    <View className="mt-5 rounded-[28px] bg-white p-5">
      <Text className="font-inter text-lg font-semibold text-slate-900">
        {t('manager.sessions.listTitle')}
      </Text>

      {sessionsQuery.isLoading
        ? (
            <View className="mt-6 items-center py-10">
              <ActivityIndicator size="large" color="#6366F1" />
            </View>
          )
        : null}

      {sessionsQuery.isError && !sessionsQuery.isLoading
        ? (
            <View className="mt-6 items-center gap-3 py-6">
              <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
              <Text className="font-inter text-sm text-red-600">
                {t('manager.sessions.errorLoading')}
              </Text>
              <Button variant="outline" size="sm" label={t('manager.sessions.errorRetry')} fullWidth={false} onPress={() => sessionsQuery.refetch()} />
            </View>
          )
        : null}

      {!sessionsQuery.isLoading && !sessionsQuery.isError
        ? (
            <View className="mt-4 gap-3">
              {(sessionsQuery.data?.data ?? []).map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onDetails={() => router.push(`/(manager)/sessions/${session.id}`)}
                  onPauseResume={() => pauseResumeMutation.mutate({ sessionId: session.id, isPaused: session.isPaused })}
                  onDelete={() => confirmDelete(session)}
                />
              ))}
              {sessionsQuery.data && sessionsQuery.data.data.length === 0
                ? (
                    <View className="items-center py-6">
                      <Ionicons name="calendar-outline" size={32} color="#9CA3AF" />
                      <Text className="font-inter mt-2 text-sm text-slate-500">
                        {t('manager.sessions.empty')}
                      </Text>
                    </View>
                  )
                : null}
            </View>
          )
        : null}
    </View>
  );
}

export function SessionsScreen() {
  const { t } = useTranslation();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const setActiveOrgId = useManagerStore.use.setActiveOrgId();
  const organizationsQuery = useOrganizations();
  const membersQuery = useOrgMembers(activeOrgId);
  const studentsQuery = useOrgStudents(activeOrgId);
  const organizationQuery = useOrganization(activeOrgId);

  useEffect(() => {
    if (!activeOrgId && organizationsQuery.data?.data[0]) {
      setActiveOrgId(organizationsQuery.data.data[0].id);
    }
  }, [activeOrgId, organizationsQuery.data, setActiveOrgId]);

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
      current: organization.currentSessions,
      limit,
    });
  }, [organizationQuery.data, t]);

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1e8]">
      <ScrollView contentContainerClassName="px-6 py-6">
        <Text className="font-inter text-3xl font-semibold text-slate-900">
          {t('manager.sessions.title')}
        </Text>
        <Text className="font-inter mt-2 text-base text-slate-500">
          {t('manager.sessions.subtitle')}
        </Text>

        <CreateSessionForm
          members={orderedMembers}
          students={studentsQuery.data?.data ?? []}
          limitMessage={limitMessage}
        />
        <SessionTemplatesList />
      </ScrollView>
    </SafeAreaView>
  );
}
