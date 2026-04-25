/* eslint-disable max-lines-per-function */
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Input, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import { clearOnboardingContext, signIn } from '@/features/auth/use-auth-store';
import { getToken } from '@/lib/auth/utils';
import { validateToken } from '@/modules/auth/services';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import { useCreateOrg } from '../hooks';
import { useManagerStore } from '../store/manager-store';
import { createOrgSchema } from '../validators';

export function OrgSetupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const setActiveOrgId = useManagerStore.use.setActiveOrgId();
  const setOrgDetails = useManagerStore.use.setOrgDetails();
  const createMutation = useCreateOrg();
  const [values, setValues] = useState({
    name: '',
    phoneE164: '',
    email: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const heroLines = useMemo(
    () => [
      t('manager.setup.heroTitle', { defaultValue: 'Create your organization' }),
      t('manager.setup.heroCopy', {
        defaultValue:
          'Set up the basics once, then start adding students, inviting teachers, and running sessions.',
      }),
    ],
    [t],
  );

  const submit = async () => {
    const parsed = createOrgSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        name: nextErrors.name?.[0] ?? '',
        email: nextErrors.email?.[0] ?? '',
      });
      return;
    }

    try {
      const organization = await createMutation.mutateAsync(parsed.data);
      try {
        const token = getToken();
        const validatedUser = await validateToken();

        if (token) {
          signIn({ token, user: validatedUser });
          clearOnboardingContext();
        }
      }
      catch {
        // If the auth context refresh lags behind org creation, keep the
        // onboarding state and let the dashboard continue with the new org.
      }
      setActiveOrgId(organization.id);
      setOrgDetails(organization);
      router.replace(AppRoute.manager.dashboard);
    }
    catch (error) {
      Alert.alert(
        t('manager.common.errorTitle', { defaultValue: 'Something went wrong' }),
        getApiErrorMessage(error, t('manager.setup.submitError', {
          defaultValue: 'We could not create your organization right now.',
        })),
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="px-6 py-8">
          <View className="rounded-r5 bg-[#2563EB] p-6">
            <Text className="font-inter text-3xl font-semibold text-[#FFFFFF]">
              {heroLines[0]}
            </Text>
            <Text className="font-inter mt-3 text-base/6 text-[#BFDBFE]">
              {heroLines[1]}
            </Text>
          </View>

          <View className="mt-6 rounded-[28px] bg-white p-5">
            <Input
              label={t('manager.setup.name', { defaultValue: 'Organization name' })}
              value={values.name}
              onChangeText={name => setValues(current => ({ ...current, name }))}
              error={errors.name}
            />
            <Input
              label={t('manager.setup.phone', { defaultValue: 'Phone (optional)' })}
              value={values.phoneE164}
              onChangeText={phoneE164 =>
                setValues(current => ({ ...current, phoneE164 }))}
              autoCapitalize="none"
            />
            <Input
              label={t('manager.setup.email', { defaultValue: 'Email (optional)' })}
              value={values.email}
              onChangeText={email => setValues(current => ({ ...current, email }))}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Input
              label={t('manager.setup.address', { defaultValue: 'Address (optional)' })}
              value={values.address}
              onChangeText={address => setValues(current => ({ ...current, address }))}
              multiline
            />

            <Button
              label={t('manager.setup.submit', { defaultValue: 'Create organization' })}
              onPress={submit}
              loading={createMutation.isPending}
              className="mt-3"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
