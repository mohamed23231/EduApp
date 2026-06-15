import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, SafeAreaView, Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';

/**
 * Shared empty state shown on any manager tab when no organization exists yet.
 * Use as an early return: `if (!activeOrgId) return <NoOrgEmptyState />;`
 */
export function NoOrgEmptyState() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 px-6 py-8" style={{ backgroundColor: colors.neutral.paper }}>
      <View className="rounded-[28px] p-6" style={{ backgroundColor: colors.brand.primary }}>
        <Text className="font-inter text-2xl font-semibold" style={{ color: colors.brand.primaryInk }}>
          {t('manager.common.noOrgTitle', { defaultValue: 'No organization yet' })}
        </Text>
        <Text className="font-inter mt-2 text-base" style={{ color: colors.brand.primaryInk }}>
          {t('manager.common.noOrgCopy', {
            defaultValue: 'Create your first organization to get started.',
          })}
        </Text>
        <Button
          className="mt-4"
          label={t('manager.setup.submit', { defaultValue: 'Create organization' })}
          onPress={() => router.push('/(manager)/(tabs)/dashboard')}
        />
      </View>
    </SafeAreaView>
  );
}
