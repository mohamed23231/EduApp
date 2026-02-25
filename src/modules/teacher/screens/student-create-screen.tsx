/**
 * StudentCreateScreen — Teacher
 * Form to create a student, then bottom-sheet next-step modal
 * (assign to session / share code / done).
 */

import type { StudentFormValues } from '../validators';
import * as Burnt from 'burnt';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Modal, Text, useModal } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import { ScreenHeader } from '../components';
import { useStudentCrud } from '../hooks';
import { studentSchema } from '../validators';

/** Student creation form fields */
function StudentForm({
  formData,
  errors,
  isSubmitting,
  onFieldChange,
  onSubmit,
}: {
  formData: StudentFormValues;
  errors: Record<string, string>;
  isSubmitting: boolean;
  onFieldChange: (field: keyof StudentFormValues) => (value: string) => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.form}>
      <Animated.View entering={FadeInDown.delay(0).duration(350)} style={styles.formGroup}>
        <Text style={styles.label}>{t('teacher.students.form.nameLabel')}</Text>
        <Input
          placeholder={t('teacher.students.form.namePlaceholder')}
          value={formData.name}
          onChangeText={onFieldChange('name')}
          error={errors.name}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.formGroup}>
        <Text style={styles.label}>{t('teacher.students.form.gradeLabel')}</Text>
        <Input
          placeholder={t('teacher.students.form.gradePlaceholder')}
          value={formData.gradeLevel}
          onChangeText={onFieldChange('gradeLevel')}
          error={errors.gradeLevel}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(350)} style={styles.formGroup}>
        <Text style={styles.label}>{t('teacher.students.form.notesLabel')}</Text>
        <Input
          placeholder={t('teacher.students.form.notesPlaceholder')}
          value={formData.notes}
          onChangeText={onFieldChange('notes')}
          error={errors.notes}
          multiline
          numberOfLines={4}
        />
      </Animated.View>

      {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

      <Animated.View entering={FadeInDown.delay(240).duration(350)}>
        <Button
          label={isSubmitting ? t('teacher.students.submitting') : t('teacher.students.createButton')}
          onPress={onSubmit}
          loading={isSubmitting}
          variant="default"
          style={styles.submitBtn}
        />
      </Animated.View>
    </View>
  );
}

/** Post-creation next-step bottom sheet */
function NextStepSheet({
  modal,
  onAssign,
  onShare,
  onDone,
}: {
  modal: ReturnType<typeof useModal>;
  onAssign: () => void;
  onShare: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Modal ref={modal.ref} snapPoints={['48%']} title={t('teacher.students.createdFlowTitle')}>
      <View style={styles.sheetContent}>
        <Text style={styles.sheetMessage}>{t('teacher.students.createdFlowMessage')}</Text>
        <Button label={t('teacher.students.createdFlowAssignSession')} onPress={onAssign} variant="default" style={styles.sheetBtn} />
        <Button label={t('teacher.students.createdFlowShareCode')} onPress={onShare} variant="outline" style={styles.sheetBtn} />
        <Button label={t('teacher.common.cancel')} onPress={onDone} variant="ghost" />
      </View>
    </Modal>
  );
}

export function StudentCreateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { createStudent, isSubmitting } = useStudentCrud();
  const nextStepModal = useModal();

  const [formData, setFormData] = useState<StudentFormValues>({
    name: '',
    gradeLevel: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);

  const handleFieldChange = (field: keyof StudentFormValues) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    try {
      studentSchema.parse(formData);
      const student = await createStudent(formData);
      setCreatedStudentId(student.id);
      Burnt.toast({ title: t('teacher.students.createdFlowTitle'), preset: 'done', haptic: 'success' });
      nextStepModal.present();
    }
    catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        const validationErrors: Record<string, string> = {};
        (error as { issues: { path: string[]; message: string }[] }).issues.forEach((issue) => {
          if (issue.path[0]) {
            validationErrors[issue.path[0]] = issue.message;
          }
        });
        setErrors(validationErrors);
      }
      else {
        setErrors({
          form: error instanceof Error ? error.message : t('teacher.common.genericError'),
        });
      }
    }
  };

  const handleAssignToSession = () => {
    if (!createdStudentId)
      return;
    nextStepModal.dismiss();
    router.replace(`${AppRoute.teacher.sessionCreate}?studentId=${createdStudentId}` as any);
  };

  const handleShareAccessCode = () => {
    if (!createdStudentId)
      return;
    nextStepModal.dismiss();
    router.replace(AppRoute.teacher.connectionCode(createdStudentId) as any);
  };

  const handleDone = () => {
    nextStepModal.dismiss();
    router.back();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScreenHeader title={t('teacher.students.createTitle')} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <StudentForm
            formData={formData}
            errors={errors}
            isSubmitting={isSubmitting}
            onFieldChange={handleFieldChange}
            onSubmit={handleSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <NextStepSheet modal={nextStepModal} onAssign={handleAssignToSession} onShare={handleShareAccessCode} onDone={handleDone} />
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
  submitBtn: {
    marginTop: 8,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 10,
  },
  sheetMessage: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  sheetBtn: {
    width: '100%',
  },
});
