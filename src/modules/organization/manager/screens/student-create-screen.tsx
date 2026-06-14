import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import {
  Button,
  Input,
  PhoneField,
  ScrollView,
  TopBar,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import {
  buildE164Phone,
  DEFAULT_COUNTRY_CODE,
} from '@/shared/utils/phone';
import { LimitReachedError, NoOrgEmptyState } from '../components';
import { useCreateStudent, useOrganization } from '../hooks';
import { useManagerStore } from '../store/manager-store';
import { createStudentSchema } from '../validators';

function CreateForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const createMutation = useCreateStudent(activeOrgId);
  const organizationQuery = useOrganization(activeOrgId);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState({ name: '', gradeLevel: '', notes: '' });
  const [parentCountryCode, setParentCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [parentLocalNumber, setParentLocalNumber] = useState('');

  const limitMessage = (() => {
    const organization = organizationQuery.data;
    const limit = organization?.limits?.maxStudents;
    if (!organization || limit === null || limit === undefined)
      return null;
    if (organization.currentStudents < limit)
      return null;
    return t('manager.limits.students', {
      defaultValue: 'Student limit reached ({{current}}/{{limit}}).',
      current: organization.currentStudents,
      limit,
    });
  })();

  const submit = async () => {
    const parentPhone = buildE164Phone(parentCountryCode, parentLocalNumber) ?? '';
    const parsed = createStudentSchema.safeParse({ ...values, parentPhone });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? null);
      return;
    }
    try {
      await createMutation.mutateAsync(parsed.data);
      setError(null);
      Alert.alert(
        t('manager.students.createScreenTitle', { defaultValue: 'Add Student' }),
        t('manager.students.createSuccess', { defaultValue: 'Student added successfully' }),
      );
      router.back();
    }
    catch (cause) {
      setError(
        getApiErrorMessage(
          cause,
          t('manager.students.submitError', { defaultValue: 'Unable to save the student right now.' }),
        ),
      );
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4, gap: 4 }}
    >
      <Input
        label={t('manager.students.fields.name', { defaultValue: 'Student name' })}
        value={values.name}
        onChangeText={name => setValues(c => ({ ...c, name }))}
      />
      <Input
        label={t('manager.students.fields.gradeLevel', { defaultValue: 'Grade level' })}
        value={values.gradeLevel}
        onChangeText={gradeLevel => setValues(c => ({ ...c, gradeLevel }))}
      />
      <PhoneField
        label={t('manager.students.fields.parentPhone', { defaultValue: 'Parent phone' })}
        countryCode={parentCountryCode}
        localNumber={parentLocalNumber}
        onCountryCodeChange={setParentCountryCode}
        onLocalNumberChange={setParentLocalNumber}
        testIDPrefix="manager-student-parent-phone"
      />
      <Input
        label={t('manager.students.fields.notes', { defaultValue: 'Notes' })}
        value={values.notes}
        onChangeText={notes => setValues(c => ({ ...c, notes }))}
        multiline
      />

      <LimitReachedError message={error ?? limitMessage} />

      <Button
        style={{ marginTop: 8 }}
        label={t('manager.students.actions.create', { defaultValue: 'Create student' })}
        onPress={submit}
        loading={createMutation.isPending}
      />
    </ScrollView>
  );
}

export function StudentCreateScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeOrgId = useManagerStore.use.activeOrgId();

  if (!activeOrgId) {
    return <NoOrgEmptyState />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.neutral.paper }}>
      <TopBar
        title={t('manager.students.createScreenTitle', { defaultValue: 'Add Student' })}
        onBack={() => router.back()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <CreateForm />
      </KeyboardAvoidingView>
    </View>
  );
}
