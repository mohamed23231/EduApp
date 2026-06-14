import type { OrgMember } from '../types/manager.types';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import { useManagerStore } from '../store/manager-store';
import { createSessionSchema } from '../validators';
import { useCreateSession } from './use-manager-org';

type CreateFormValues = {
  subject: string;
  time: string;
  durationMinutes: number;
  assignedMemberId: string;
  daysOfWeek: number[];
  studentIds: string[];
};

export function useCreateSessionForm({ members }: { members: OrgMember[] }) {
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
