import { useRouter } from 'expo-router';
import { Button, Text, View } from '@/components/ui';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const signOut = useAuth.use.signOut();

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg font-semibold">Super Admin Dashboard</Text>
      <Text className="mt-2 text-sm">Scaffolded route for super admin production flows.</Text>
      <Button
        className="mt-6 bg-cyan-500"
        textClassName="text-white"
        label="Go to Login"
        onPress={() => {
          signOut();
          router.replace('/login');
        }}
      />
    </View>
  );
}
