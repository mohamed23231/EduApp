import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Text, View } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const signOut = useAuth.use.signOut();

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold">{t('admin.dashboard.title')}</Text>
      <Text className="mt-2 text-sm">{t('admin.dashboard.subtitle')}</Text>
      <Button
        className="mt-6 bg-brand"
        textClassName="text-white"
        label={t('common.goToLogin')}
        onPress={() => {
          signOut();
          router.replace(AppRoute.auth.login);
        }}
      />
    </View>
  );
}
