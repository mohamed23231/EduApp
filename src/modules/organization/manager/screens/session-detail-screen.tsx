import type { MarkAttendanceInput, OrgSessionInstance } from '../types/manager.types';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
import {
  useCloseSession,
  useMarkAttendance,
  useOrgInstances,
  useOrgSession,
  useStartSession,
} from '../hooks';
import { useManagerStore } from '../store/manager-store';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED';

type DraftRecord = {
  status: AttendanceStatus;
  rating?: number;
  excuseNote?: string;
};

const DAY_KEYS = ['', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

const RATING_ROW_1 = [0, 1, 2, 3, 4, 5] as const;
const RATING_ROW_2 = [6, 7, 8, 9, 10] as const;
const ATTENDANCE_STATUSES: readonly AttendanceStatus[] = ['PRESENT', 'ABSENT', 'EXCUSED'] as const;

/** Compute a date string N days ago in YYYY-MM-DD format. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Group instances by date and sort newest first. */
function groupInstancesByDate(
  instances: OrgSessionInstance[],
): Array<{ date: string; instances: OrgSessionInstance[] }> {
  const map = new Map<string, OrgSessionInstance[]>();
  for (const inst of instances) {
    const group = map.get(inst.date) ?? [];
    group.push(inst);
    map.set(inst.date, group);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, grouped]) => ({ date, instances: grouped }));
}

export function SessionDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const activeOrgId = useManagerStore.use.activeOrgId();

  const sessionQuery = useOrgSession(activeOrgId, params.id);
  const fromDate = daysAgo(7);
  const toDate = new Date().toISOString().slice(0, 10);
  const instancesQuery = useOrgInstances(activeOrgId, { from: fromDate, to: toDate });

  if (sessionQuery.isLoading || instancesQuery.isLoading) {
    return <LoadingView />;
  }

  if (sessionQuery.isError || instancesQuery.isError) {
    return (
      <ErrorView
        onRetry={() => {
          sessionQuery.refetch();
          instancesQuery.refetch();
        }}
      />
    );
  }

  return (
    <SessionDetailContent
      templateId={params.id}
      sessionQuery={sessionQuery}
      instancesQuery={instancesQuery}
      activeOrgId={activeOrgId}
    />
  );
}

// ---------------------------------------------------------------------------
// Top-level content (extracted to respect 110-line limit)
// ---------------------------------------------------------------------------

type ContentProps = {
  templateId: string;
  sessionQuery: ReturnType<typeof useOrgSession>;
  instancesQuery: ReturnType<typeof useOrgInstances>;
  activeOrgId: string | null | undefined;
};

function SessionDetailContent({ templateId, sessionQuery, instancesQuery, activeOrgId }: ContentProps) {
  const { t } = useTranslation();
  const template = sessionQuery.data;

  const sessionInstances = useMemo(
    () => (instancesQuery.data?.data ?? []).filter(i => i.templateId === templateId),
    [instancesQuery.data?.data, templateId],
  );
  const groupedInstances = useMemo(() => groupInstancesByDate(sessionInstances), [sessionInstances]);
  const activeInstance = sessionInstances.find(i => i.state === 'ACTIVE');

  const startMutation = useStartSession(activeOrgId);
  const closeMutation = useCloseSession(activeOrgId);

  const daysOfWeekLabel = useMemo(() => {
    const days = template?.daysOfWeek;
    if (!days?.length)
      return '';
    return days
      .map((num) => {
        const key = DAY_KEYS[num] ?? '';
        return key ? t(`manager.days.${key}`, { defaultValue: key }) : '';
      })
      .filter(Boolean)
      .join(', ');
  }, [template, t]);

  const handleCloseSession = useCallback(
    (instanceId: string) => {
      const inst = sessionInstances.find(i => i.id === instanceId);
      const unmarkedCount = inst?.students?.length ?? 0;

      if (unmarkedCount > 0) {
        Alert.alert(
          t('manager.sessionDetail.closeWarningTitle', { defaultValue: 'Close session' }),
          t('manager.sessionDetail.closeWarning', {
            count: unmarkedCount,
            defaultValue: '{{count}} unmarked students will be auto-marked as absent. Continue?',
          }),
          [
            { text: t('manager.common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
            {
              text: t('manager.sessionDetail.closeConfirm', { defaultValue: 'Confirm' }),
              style: 'destructive',
              onPress: () => closeMutation.mutate(instanceId),
            },
          ],
        );
      }
      else {
        closeMutation.mutate(instanceId);
      }
    },
    [closeMutation, sessionInstances, t],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1e8]">
      <ScrollView contentContainerClassName="px-6 py-6">
        <TemplateHeader template={template} daysOfWeekLabel={daysOfWeekLabel} />

        <RecentInstancesSection
          groupedInstances={groupedInstances}
          onStart={id => startMutation.mutate(id)}
          onClose={handleCloseSession}
        />

        {activeInstance
          ? (
              <AttendanceSection
                activeInstance={activeInstance}
                activeOrgId={activeOrgId}
              />
            )
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Loading / Error states
// ---------------------------------------------------------------------------

function LoadingView() {
  const { t } = useTranslation();
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-[#f5f1e8]">
      <ActivityIndicator size="large" />
      <Text className="font-inter mt-3 text-base text-slate-500">
        {t('manager.common.loading', { defaultValue: 'Loading...' })}
      </Text>
    </SafeAreaView>
  );
}

function ErrorView({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-[#f5f1e8] px-6">
      <Text className="font-inter text-center text-base text-rose-600">
        {t('manager.sessionDetail.loadError', { defaultValue: 'Failed to load session data.' })}
      </Text>
      <Button
        className="mt-4"
        variant="outline"
        label={t('manager.sessionDetail.retry', { defaultValue: 'Retry' })}
        fullWidth={false}
        onPress={onRetry}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Template header with enriched info
// ---------------------------------------------------------------------------

type TemplateHeaderProps = {
  template: ReturnType<typeof useOrgSession>['data'];
  daysOfWeekLabel: string;
};

function TemplateHeader({ template, daysOfWeekLabel }: TemplateHeaderProps) {
  const { t } = useTranslation();
  const studentCount = template?.studentCount ?? template?.students?.length ?? 0;

  return (
    <>
      <Text className="font-inter text-3xl font-semibold text-slate-900">
        {template?.subject ?? t('manager.sessionDetail.title', { defaultValue: 'Session detail' })}
      </Text>
      <Text className="font-inter mt-2 text-base text-slate-500">
        {template?.time}
        {' '}
        •
        {template?.assignedMember.name}
      </Text>

      {template
        ? (
            <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1">
              {daysOfWeekLabel
                ? (
                    <Text className="font-inter text-sm text-slate-500">
                      {t('manager.sessionDetail.daysLabel', { defaultValue: 'Days' })}
                      :
                      {daysOfWeekLabel}
                    </Text>
                  )
                : null}
              {template.durationMinutes > 0
                ? (
                    <Text className="font-inter text-sm text-slate-500">
                      {t('manager.sessionDetail.durationLabel', { defaultValue: 'Duration' })}
                      :
                      {' '}
                      {t('manager.sessionDetail.durationValue', {
                        minutes: template.durationMinutes,
                        defaultValue: '{{minutes}} min',
                      })}
                    </Text>
                  )
                : null}
              {studentCount > 0
                ? (
                    <Text className="font-inter text-sm text-slate-500">
                      {t('manager.sessionDetail.studentCount', {
                        count: studentCount,
                        defaultValue: '{{count}} students',
                      })}
                    </Text>
                  )
                : null}
              {template.isPaused
                ? (
                    <View className="rounded-full bg-amber-100 px-3 py-0.5">
                      <Text className="font-inter text-xs font-medium text-amber-800">
                        {t('manager.sessionDetail.paused', { defaultValue: 'Paused' })}
                      </Text>
                    </View>
                  )
                : null}
            </View>
          )
        : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// Recent instances section (grouped by date)
// ---------------------------------------------------------------------------

type RecentInstancesSectionProps = {
  groupedInstances: Array<{ date: string; instances: OrgSessionInstance[] }>;
  onStart: (instanceId: string) => void;
  onClose: (instanceId: string) => void;
};

function RecentInstancesSection({ groupedInstances, onStart, onClose }: RecentInstancesSectionProps) {
  const { t } = useTranslation();
  return (
    <View className="mt-5 rounded-[28px] bg-white p-5">
      <Text className="font-inter text-lg font-semibold text-slate-900">
        {t('manager.sessionDetail.recentInstances', { defaultValue: 'Recent instances' })}
      </Text>

      {groupedInstances.length === 0
        ? (
            <Text className="font-inter mt-4 text-sm text-slate-500">
              {t('manager.sessionDetail.noInstances', {
                defaultValue: 'No instances found for the last 7 days.',
              })}
            </Text>
          )
        : null}

      {groupedInstances.map(group => (
        <View key={group.date} className="mt-4">
          <Text className="font-inter mb-2 text-sm font-medium text-slate-400">{group.date}</Text>
          <View className="gap-3">
            {group.instances.map(instance => (
              <InstanceCard
                key={instance.id}
                instance={instance}
                onStart={() => onStart(instance.id)}
                onClose={() => onClose(instance.id)}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function InstanceCard({
  instance,
  onStart,
  onClose,
}: {
  instance: OrgSessionInstance;
  onStart: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View className="rounded-2xl border border-slate-200 p-4">
      <Text className="font-inter text-base font-semibold text-slate-900">
        {instance.date}
        {' '}
        •
        {instance.time}
      </Text>
      <Text className="font-inter mt-1 text-sm text-slate-500">
        {t(`manager.sessionDetail.instanceState.${instance.state.toLowerCase()}`, {
          defaultValue: instance.state,
        })}
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-3">
        {instance.state === 'DRAFT'
          ? (
              <Button
                variant="outline"
                label={t('manager.sessionDetail.start', { defaultValue: 'Start session' })}
                fullWidth={false}
                onPress={onStart}
              />
            )
          : null}
        {instance.state === 'ACTIVE'
          ? (
              <Button
                variant="outline"
                label={t('manager.sessionDetail.close', { defaultValue: 'Close session' })}
                fullWidth={false}
                onPress={onClose}
              />
            )
          : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Attendance section
// ---------------------------------------------------------------------------

type AttendanceSectionProps = {
  activeInstance: OrgSessionInstance;
  activeOrgId: string | null | undefined;
};

function AttendanceSection({ activeInstance, activeOrgId }: AttendanceSectionProps) {
  const { t } = useTranslation();
  const markMutation = useMarkAttendance(activeOrgId, activeInstance.id);
  const [draftAttendance, setDraftAttendance] = useState<Record<string, DraftRecord>>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const students = useMemo(() => activeInstance.students ?? [], [activeInstance.students]);
  const markedCount = students.filter(s => draftAttendance[s.id]?.status != null).length;

  const statusLabel = useCallback(
    (status: AttendanceStatus) =>
      t(`manager.sessionDetail.status.${status.toLowerCase()}`, { defaultValue: status }),
    [t],
  );

  const updateDraft = useCallback(
    (studentId: string, patch: Partial<DraftRecord>) => {
      setDraftAttendance(current => ({
        ...current,
        [studentId]: { ...current[studentId], ...patch } as DraftRecord,
      }));
    },
    [],
  );

  const saveAttendance = async () => {
    const records: MarkAttendanceInput['records'] = students.map((student) => {
      const draft = draftAttendance[student.id];
      return {
        studentId: student.id,
        status: draft?.status ?? 'PRESENT',
        rating: draft?.rating,
        excuseNote: draft?.status === 'EXCUSED' ? draft.excuseNote : undefined,
      };
    });

    try {
      await markMutation.mutateAsync({ records });
      setError(null);
      setSuccessMessage(t('manager.sessionDetail.saveAttendanceSuccess', {
        defaultValue: 'Attendance saved successfully.',
      }));
    }
    catch (cause) {
      setError(
        getApiErrorMessage(
          cause,
          t('manager.sessionDetail.attendanceError', {
            defaultValue: 'Could not save attendance right now.',
          }),
        ),
      );
    }
  };

  return (
    <View className="mt-5 rounded-[28px] bg-white p-5">
      <View className="flex-row items-center justify-between">
        <Text className="font-inter text-lg font-semibold text-slate-900">
          {t('manager.sessionDetail.attendanceTitle', { defaultValue: 'Attendance' })}
        </Text>
        <Text className="font-inter text-sm text-slate-500">
          {t('manager.sessionDetail.markedCount', {
            marked: markedCount,
            total: students.length,
            defaultValue: 'Marked: {{marked}}/{{total}}',
          })}
        </Text>
      </View>

      <View className="mt-4 gap-3">
        {students.map(student => (
          <StudentAttendanceCard
            key={student.id}
            studentName={student.name}
            draft={draftAttendance[student.id]}
            statusLabel={statusLabel}
            onStatusChange={status => updateDraft(student.id, { status })}
            onRatingChange={rating => updateDraft(student.id, { rating })}
            onExcuseNoteChange={excuseNote => updateDraft(student.id, { excuseNote })}
          />
        ))}
      </View>

      {successMessage && !error
        ? (
            <Text className="font-inter mt-3 text-sm text-emerald-700">{successMessage}</Text>
          )
        : null}
      {error
        ? (
            <Text className="font-inter mt-3 text-sm text-rose-600">{error}</Text>
          )
        : null}

      <Button
        className="mt-4"
        label={t('manager.sessionDetail.saveAttendance', { defaultValue: 'Save attendance' })}
        onPress={saveAttendance}
        loading={markMutation.isPending}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Student attendance card
// ---------------------------------------------------------------------------

type StudentAttendanceCardProps = {
  studentName: string;
  draft: DraftRecord | undefined;
  statusLabel: (status: AttendanceStatus) => string;
  onStatusChange: (status: AttendanceStatus) => void;
  onRatingChange: (rating: number) => void;
  onExcuseNoteChange: (note: string) => void;
};

function StudentAttendanceCard({
  studentName,
  draft,
  statusLabel,
  onStatusChange,
  onRatingChange,
  onExcuseNoteChange,
}: StudentAttendanceCardProps) {
  const { t } = useTranslation();
  const currentStatus = draft?.status;

  return (
    <View className="rounded-2xl border border-slate-200 p-4">
      <Text className="font-inter text-base font-semibold text-slate-900">{studentName}</Text>

      {/* Status chips */}
      <View className="mt-3 flex-row flex-wrap gap-2">
        {ATTENDANCE_STATUSES.map(status => (
          <Pressable
            key={status}
            onPress={() => onStatusChange(status)}
            accessibilityLabel={t('manager.sessionDetail.accessibility.statusChip', {
              name: studentName,
              status: statusLabel(status),
              defaultValue: `Mark ${studentName} as ${statusLabel(status)}`,
            })}
            accessibilityRole="radio"
            accessibilityState={{ selected: currentStatus === status }}
            className={`rounded-full px-4 py-2 ${
              currentStatus === status ? 'bg-slate-900' : 'bg-slate-100'
            }`}
          >
            <Text
              className={`font-inter text-sm ${
                currentStatus === status ? 'text-white' : 'text-slate-700'
              }`}
            >
              {statusLabel(status)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Excuse note input -- only shown for EXCUSED */}
      {currentStatus === 'EXCUSED'
        ? (
            <Input
              label={t('manager.sessionDetail.excuseNoteLabel', {
                defaultValue: 'Excuse note',
              })}
              placeholder={t('manager.sessionDetail.excuseNotePlaceholder', {
                defaultValue: 'Reason for excuse...',
              })}
              value={draft?.excuseNote ?? ''}
              onChangeText={onExcuseNoteChange}
              multiline
              numberOfLines={2}
            />
          )
        : null}

      {/* Rating chips 0-10 in two rows */}
      <Text className="font-inter mt-3 text-xs text-slate-400">
        {t('manager.sessionDetail.ratingLabel', { defaultValue: 'Rating' })}
      </Text>
      <View className="mt-1 flex-row gap-2">
        {RATING_ROW_1.map(score => (
          <RatingChip
            key={score}
            score={score}
            selected={draft?.rating === score}
            onPress={() => onRatingChange(score)}
          />
        ))}
      </View>
      <View className="mt-2 flex-row gap-2">
        {RATING_ROW_2.map(score => (
          <RatingChip
            key={score}
            score={score}
            selected={draft?.rating === score}
            onPress={() => onRatingChange(score)}
          />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Rating chip
// ---------------------------------------------------------------------------

function RatingChip({ score, selected, onPress }: { score: number; selected: boolean; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={t('manager.sessions.accessibility.ratingChip', {
        score,
        defaultValue: `Set rating ${score}`,
      })}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      className={`rounded-full px-3 py-2 ${selected ? 'bg-emerald-600' : 'bg-emerald-50'}`}
    >
      <Text className={`font-inter text-sm ${selected ? 'text-white' : 'text-emerald-700'}`}>
        {score}
      </Text>
    </Pressable>
  );
}
