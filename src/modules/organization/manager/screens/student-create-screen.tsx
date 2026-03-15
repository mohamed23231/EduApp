import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, I18nManager, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Button,
  Input,
  PhoneField,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
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
    <ScrollView contentContainerClassName="px-6 pb-12 pt-4">
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
        className="mt-6"
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
          {t('manager.students.createScreenTitle', { defaultValue: 'Add Student' })}
        </Text>
      </View>

      {!activeOrgId
        ? (
            <NoOrgEmptyState />
          )
        : (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="flex-1"
            >
              <CreateForm />
            </KeyboardAvoidingView>
          )}
    </SafeAreaView>
  );
}
