import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { useOrganization } from '../hooks';
import { useManagerStore } from '../store/manager-store';

export function MoreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const organizationQuery = useOrganization(activeOrgId);

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1e8]">
      <ScrollView contentContainerClassName="px-6 py-6">
        <Text className="font-inter text-3xl font-semibold text-slate-900">
          {t('manager.more.title', { defaultValue: 'More' })}
        </Text>
        <Text className="font-inter mt-2 text-base text-slate-500">
          {t('manager.more.subtitle', {
            defaultValue: 'Settings, reports, and higher-level organization controls live here.',
          })}
        </Text>
        {organizationQuery.data?.name
          ? (
              <Text className="font-inter mt-2 text-sm font-medium text-slate-700">
                {t('manager.more.orgName', {
                  defaultValue: 'Organization: {{name}}',
                  name: organizationQuery.data.name,
                })}
              </Text>
            )
          : null}

        <View className="mt-5 gap-3">
          <View className="rounded-[28px] bg-white p-5">
            <Text className="font-inter text-lg font-semibold text-slate-900">
              {t('manager.more.settings.title', { defaultValue: 'Settings' })}
            </Text>
            <Text className="font-inter mt-2 text-sm text-slate-500">
              {t('manager.more.settings.body', {
                defaultValue: 'Update contact information and monitor limit usage.',
              })}
            </Text>
            <Button
              className="mt-4"
              variant="outline"
              label={t('manager.more.settings.cta', { defaultValue: 'Open settings' })}
              onPress={() => router.push('/(manager)/settings')}
            />
          </View>

          <View className="rounded-[28px] bg-white p-5">
            <Text className="font-inter text-lg font-semibold text-slate-900">
              {t('manager.more.reports.title', { defaultValue: 'Reports' })}
            </Text>
            <Text className="font-inter mt-2 text-sm text-slate-500">
              {t('manager.more.reports.body', {
                defaultValue: 'Review attendance, engagement, and teacher performance trends.',
              })}
            </Text>
            <Button
              className="mt-4"
              variant="outline"
              label={t('manager.more.reports.cta', { defaultValue: 'Open reports' })}
              onPress={() => router.push('/(manager)/reports')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
