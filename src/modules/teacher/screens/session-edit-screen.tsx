/**
 * SessionEditScreen — Teacher
 * Edit / delete a session template.
 * Time picker + searchable student picker via bottom sheets.
 */

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Student } from '../types';
import type { SessionFormValues } from '../validators';
import * as Burnt from 'burnt';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useModal } from '@/components/ui';
import colors from '@/components/ui/colors';
import { getApiErrorMessage, isApiError } from '@/shared/services/api-utils';
import {
  ConfirmSheet,
  ScreenHeader,
  StudentSelectSheet,
  TimePickerSheet,
} from '../components';
import { EditFormBody } from '../components/session-edit';
import { useSessionCrud } from '../hooks';
import { getAvailableStudents, getTemplate } from '../services';
import { sessionSchema } from '../validators';

type FormErrors = Record<string, string>;

function parseZodErrors(error: unknown, t: (key: string) => string): FormErrors {
  if (error && typeof error === 'object' && 'issues' in error) {
    const ve: FormErrors = {};
    (error as { issues: { path: string[]; message: string }[] }).issues.forEach((issue) => {
      if (issue.path[0]) {
        ve[issue.path[0]] = t(issue.message);
      }
    });
    return ve;
  }
  return {};
}

// eslint-disable-next-line max-lines-per-function
function useSessionEditState(id: string) {
  const router = useRouter();
  const { t } = useTranslation();
  const { updateSession, deleteSession, isSubmitting } = useSessionCrud();
  const deleteModal = useModal();
  const timePicker = useModal();
  const studentPicker = useModal();

  const [formData, setFormData] = useState<SessionFormValues>({ subject: '', daysOfWeek: [], time: '', studentIds: [] });
  const [errors, setErrors] = useState<FormErrors>({});
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id)
      return;
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const [template, students] = await Promise.all([getTemplate(id), getAvailableStudents(id)]);
        if (!cancelled) {
          // Strip seconds from HH:mm:ss → HH:mm for display
          const normalizedTime = template.time?.includes(':')
            ? template.time.split(':').slice(0, 2).join(':')
            : template.time;
          setFormData({
            subject: template.subject,
            daysOfWeek: template.daysOfWeek,
            time: normalizedTime,
            studentIds: template.assignedStudents.map((s: Student) => s.id),
          });
          setAvailableStudents(students);
        }
      }
      catch {
        if (!cancelled) {
          router.back();
        }
      }
      finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  const handleChange = (field: keyof SessionFormValues) => (value: SessionFormValues[keyof SessionFormValues]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    try {
      sessionSchema.parse(formData);
      await updateSession(id, formData);
      Burnt.toast({ title: t('teacher.common.save'), preset: 'done', haptic: 'success' });
      router.back();
    }
    catch (error) {
      const ve = parseZodErrors(error, t);
      if (Object.keys(ve).length) {
        setErrors(ve);
      }
      else {
        setErrors({
          form: isApiError(error) && error.response?.status === 403
            ? t('teacher.common.accountExpired', { defaultValue: 'Your account has expired. Please contact support to renew.' })
            : getApiErrorMessage(error, t('teacher.common.genericError')),
        });
      }
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSession(id);
      deleteModal.dismiss();
      Burnt.toast({ title: t('teacher.sessions.deleteSuccess'), preset: 'done', haptic: 'success' });
      router.back();
    }
    catch {
      Burnt.toast({ title: t('teacher.common.genericError'), preset: 'error', haptic: 'error' });
      setIsDeleting(false);
      deleteModal.dismiss();
    }
  };

  return {
    t,
    formData,
    errors,
    availableStudents,
    isLoading,
    isSubmitting,
    isDeleting,
    deleteModal,
    timePicker,
    studentPicker,
    handleChange,
    handleSubmit,
    handleDelete,
  };
}

export function SessionEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useSessionEditState(id ?? '');
  const {
    t,
    formData,
    errors,
    availableStudents,
    isLoading,
    isSubmitting,
    isDeleting,
    deleteModal,
    timePicker,
    studentPicker,
    handleChange,
    handleSubmit,
    handleDelete,
  } = state;

  const selectedStudentNames = availableStudents
    .filter((s: Student) => formData.studentIds.includes(s.id))
    .map((s: Student) => s.name)
    .join(', ');

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScreenHeader title={t('teacher.sessions.editTitle')} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScreenHeader title={t('teacher.sessions.editTitle')} />
      <EditFormBody
        formData={formData}
        errors={errors}
        isSubmitting={isSubmitting}
        isDeleting={isDeleting}
        selectedStudentNames={selectedStudentNames}
        timePicker={timePicker}
        studentPicker={studentPicker}
        deleteModal={deleteModal}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        t={t}
      />
      <TimePickerSheet
        ref={timePicker.ref as React.RefObject<BottomSheetModal | null>}
        value={formData.time}
        onChange={handleChange('time') as (v: string) => void}
      />
      <StudentSelectSheet
        ref={studentPicker.ref as React.RefObject<BottomSheetModal | null>}
        availableStudents={availableStudents}
        selectedIds={formData.studentIds}
        onConfirm={handleChange('studentIds') as (v: string[]) => void}
      />
      <ConfirmSheet
        ref={deleteModal.ref as React.RefObject<BottomSheetModal | null>}
        title={t('teacher.sessions.deleteConfirmTitle')}
        message={t('teacher.sessions.deleteConfirmMessage')}
        confirmLabel={t('teacher.sessions.delete')}
        cancelLabel={t('teacher.common.cancel')}
        onConfirm={handleDelete}
        onCancel={deleteModal.dismiss}
        isLoading={isDeleting}
        variant="destructive"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.paper,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
