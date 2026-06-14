import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Input, PressButton, Text, TopBar } from '@/components/ui';
import colors from '@/components/ui/colors';
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
  const [values, setValues] = useState({ name: '', phoneE164: '', email: '', address: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const heroTitle = t('manager.setup.heroTitle', { defaultValue: 'Create your organization' });
  const heroCopy = t('manager.setup.heroCopy', { defaultValue: 'Set up the basics once, then start adding students, inviting teachers, and running sessions.' });

  const submit = async () => {
    const parsed = createOrgSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors = parsed.error.flatten().fieldErrors;
      setErrors({ name: nextErrors.name?.[0] ?? '', email: nextErrors.email?.[0] ?? '' });
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
        // auth context refresh may lag; continue with new org
      }
      setActiveOrgId(organization.id);
      setOrgDetails(organization);
      router.replace(AppRoute.manager.dashboard);
    }
    catch (error) {
      Alert.alert(
        t('manager.common.errorTitle', { defaultValue: 'Something went wrong' }),
        getApiErrorMessage(error, t('manager.setup.submitError', { defaultValue: 'We could not create your organization right now.' })),
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      <TopBar title={t('manager.setup.screenTitle', { defaultValue: 'New Organization' })} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48, paddingTop: 8 }}>
          {/* Hero card */}
          <View style={{ backgroundColor: colors.neutral.ink, borderRadius: 22, padding: 20, marginBottom: 20, overflow: 'hidden', position: 'relative' }}>
            <View style={{ position: 'absolute', top: -40, end: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: colors.brand.primary, opacity: 0.25 }} />
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.neutral.white, letterSpacing: -0.5, lineHeight: 28, position: 'relative' }}>
              {heroTitle}
            </Text>
            <Text style={{ fontSize: 13, color: colors.neutral.dim, marginTop: 10, fontWeight: '500', lineHeight: 20, position: 'relative' }}>
              {heroCopy}
            </Text>
          </View>

          {/* Form card */}
          <View style={{ backgroundColor: colors.neutral.card, borderRadius: 24, padding: 20, borderWidth: 1.5, borderColor: colors.neutral.rule, gap: 4 }}>
            <Input
              label={t('manager.setup.name', { defaultValue: 'Organization name' })}
              value={values.name}
              onChangeText={name => setValues(c => ({ ...c, name }))}
              error={errors.name}
            />
            <Input
              label={t('manager.setup.phone', { defaultValue: 'Phone (optional)' })}
              value={values.phoneE164}
              onChangeText={phoneE164 => setValues(c => ({ ...c, phoneE164 }))}
              autoCapitalize="none"
            />
            <Input
              label={t('manager.setup.email', { defaultValue: 'Email (optional)' })}
              value={values.email}
              onChangeText={email => setValues(c => ({ ...c, email }))}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Input
              label={t('manager.setup.address', { defaultValue: 'Address (optional)' })}
              value={values.address}
              onChangeText={address => setValues(c => ({ ...c, address }))}
              multiline
            />
          </View>

          <PressButton
            variant="gradient"
            size="lg"
            fullWidth
            label={t('manager.setup.submit', { defaultValue: 'Create organization' })}
            onPress={submit}
            loading={createMutation.isPending}
            style={{ marginTop: 20 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
