/**
 * StudentCreateScreen — Teacher
 * Form to create a student, then bottom-sheet next-step modal
 * (assign to session / share code / done).
 */

import type { CreateStudentFormValues } from '../validators';
import * as Burnt from 'burnt';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useModal } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import {
  buildE164Phone,
  DEFAULT_COUNTRY_CODE,
  getPhoneValidationErrorKey,
} from '@/shared/utils/phone';
import { ScreenHeader } from '../components';
import { NextStepSheet, StudentForm } from '../components/student-create';
import { useStudentCrud } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';
import { createStudentSchema } from '../validators';

// eslint-disable-next-line max-lines-per-function
export function StudentCreateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { createStudent, isSubmitting } = useStudentCrud();
  const nextStepModal = useModal();

  const [formData, setFormData] = useState<CreateStudentFormValues>({
    name: '',
    gradeLevel: '',
    notes: '',
    parentPhone: '',
  });
  const [parentCountryCode, setParentCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [parentLocalNumber, setParentLocalNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);

  const handleFieldChange = (field: keyof CreateStudentFormValues) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleParentCountryCodeChange = (value: string) => {
    setParentCountryCode(value);
    const composedPhone = buildE164Phone(value, parentLocalNumber);
    setFormData(prev => ({ ...prev, parentPhone: composedPhone ?? '' }));
    if (errors.parentPhone) {
      setErrors(prev => ({ ...prev, parentPhone: '' }));
    }
  };

  const handleParentLocalNumberChange = (value: string) => {
    setParentLocalNumber(value);
    const composedPhone = buildE164Phone(parentCountryCode, value);
    setFormData(prev => ({ ...prev, parentPhone: composedPhone ?? '' }));
    if (errors.parentPhone) {
      setErrors(prev => ({ ...prev, parentPhone: '' }));
    }
  };

  const handleSubmit = async () => {
    try {
      const normalizedParentPhone = buildE164Phone(parentCountryCode, parentLocalNumber);
      if (!parentLocalNumber.trim()) {
        setErrors({ parentPhone: t('teacher.students.form.validation.parentPhoneRequired') });
        return;
      }
      if (!normalizedParentPhone) {
        setErrors({ parentPhone: t(getPhoneValidationErrorKey(parentCountryCode)) });
        return;
      }

      const payload = {
        ...formData,
        parentPhone: normalizedParentPhone,
      };

      createStudentSchema.parse(payload);
      const student = await createStudent(payload);
      setCreatedStudentId(student.id);
      Burnt.toast({ title: t('teacher.students.createdFlowTitle'), preset: 'done', haptic: 'success' });
      nextStepModal.present();
    }
    catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        const validationErrors: Record<string, string> = {};
        (error as { issues: { path: string[]; message: string }[] }).issues.forEach((issue) => {
          if (issue.path[0]) {
            validationErrors[issue.path[0]] = t(issue.message);
          }
        });
        setErrors(validationErrors);
      }
      else {
        setErrors({
          form: extractErrorMessage(error, t),
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
            parentCountryCode={parentCountryCode}
            parentLocalNumber={parentLocalNumber}
            onParentCountryCodeChange={handleParentCountryCodeChange}
            onParentLocalNumberChange={handleParentLocalNumberChange}
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
});
