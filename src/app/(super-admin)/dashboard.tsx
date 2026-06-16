import { useRouter } from 'expo-router';
import { Button, Text, View } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const signOut = useAuth.use.signOut();

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold">Super Admin Dashboard</Text>
      <Text className="mt-2 text-sm">Scaffolded route for super admin production flows.</Text>
      <Button
        className="mt-6 bg-brand"
        textClassName="text-white"
        label="Go to Login"
        onPress={() => {
          signOut();
          router.replace(AppRoute.auth.login);
        }}
      />
    </View>
  );
}
