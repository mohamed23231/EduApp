/**
 * StudentEditScreen — Teacher
 * Edit / delete a student. Delete via bottom sheet. Quick code access in header.
 */

import type { StudentFormValues } from '../validators';
import { Ionicons } from '@expo/vector-icons';
import * as Burnt from 'burnt';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Text, useModal } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import { ConfirmSheet, ScreenHeader } from '../components';
import { useStudentCrud } from '../hooks';
import { getStudent } from '../services';
import { studentSchema } from '../validators';

type FormErrors = Record<string, string>;

function parseZodErrors(error: unknown): FormErrors {
  if (error && typeof error === 'object' && 'issues' in error) {
    const ve: FormErrors = {};
    (error as { issues: { path: string[]; message: string }[] }).issues.forEach((issue) => {
      if (issue.path[0]) {
        ve[issue.path[0]] = issue.message;
      }
    });
    return ve;
  }
  return {};
}

function useStudentEditState(id: string) {
  const router = useRouter();
  const { t } = useTranslation();
  const { updateStudent, deleteStudent, isSubmitting } = useStudentCrud();
  const deleteModal = useModal();

  const [formData, setFormData] = useState<StudentFormValues>({ name: '', gradeLevel: '', notes: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id)
      return;
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const s = await getStudent(id);
        if (!cancelled) {
          setFormData({ name: s.name, gradeLevel: s.gradeLevel ?? '', notes: s.notes ?? '' });
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

  const handleChange = (field: keyof StudentFormValues) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    try {
      studentSchema.parse(formData);
      await updateStudent(id, formData);
      Burnt.toast({ title: t('teacher.studentActions.studentUpdated'), preset: 'done', haptic: 'success' });
      router.back();
    }
    catch (error) {
      const ve = parseZodErrors(error);
      setErrors(Object.keys(ve).length
        ? ve
        : { form: error instanceof Error ? error.message : t('teacher.common.genericError') });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteStudent(id);
      deleteModal.dismiss();
      Burnt.toast({ title: t('teacher.studentActions.studentDeleted'), preset: 'done', haptic: 'success' });
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
    router,
    formData,
    errors,
    isLoading,
    isSubmitting,
    isDeleting,
    deleteModal,
    handleChange,
    handleSubmit,
    handleDelete,
  };
}

export function StudentEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useStudentEditState(id ?? '');
  const { t, router, formData, errors, isLoading, isSubmitting, isDeleting, deleteModal } = state;

  const codeBtn = (
    <Pressable
      onPress={() => router.push(AppRoute.teacher.connectionCode(id ?? '') as any)}
      style={({ pressed }) => [styles.codeBtn, pressed && styles.codeBtnPressed]}
      accessibilityRole="button"
      accessibilityLabel={t('teacher.students.connectionCodeButton')}
    >
      <Ionicons name="key-outline" size={18} color="#3B82F6" />
    </Pressable>
  );

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScreenHeader title={t('teacher.students.editTitle')} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScreenHeader title={t('teacher.students.editTitle')} right={codeBtn} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('teacher.students.form.nameLabel')}</Text>
              <Input placeholder={t('teacher.students.form.namePlaceholder')} value={formData.name} onChangeText={state.handleChange('name')} error={errors.name} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('teacher.students.form.gradeLabel')}</Text>
              <Input placeholder={t('teacher.students.form.gradePlaceholder')} value={formData.gradeLevel} onChangeText={state.handleChange('gradeLevel')} error={errors.gradeLevel} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('teacher.students.form.notesLabel')}</Text>
              <Input placeholder={t('teacher.students.form.notesPlaceholder')} value={formData.notes} onChangeText={state.handleChange('notes')} error={errors.notes} multiline numberOfLines={4} />
            </View>
            {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}
            <View style={styles.buttonRow}>
              <Button label={isSubmitting ? t('teacher.students.updating') : t('teacher.common.save')} onPress={state.handleSubmit} loading={isSubmitting} variant="default" style={styles.saveBtn} />
              <Button label={t('teacher.common.delete')} onPress={() => deleteModal.present()} variant="destructive" disabled={isDeleting} style={styles.deleteBtn} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <ConfirmSheet
        ref={deleteModal.ref}
        title={t('teacher.students.deleteConfirmTitle')}
        message={t('teacher.students.deleteConfirmMessage')}
        confirmLabel={t('teacher.common.delete')}
        cancelLabel={t('teacher.common.cancel')}
        onConfirm={state.handleDelete}
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
    backgroundColor: '#F9FAFB',
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    flexGrow: 1,
  },
  form: {
    gap: 16,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  formError: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  saveBtn: {
    flex: 1,
  },
  deleteBtn: {
    flex: 1,
  },
  codeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBtnPressed: {
    backgroundColor: '#DBEAFE',
  },
});
