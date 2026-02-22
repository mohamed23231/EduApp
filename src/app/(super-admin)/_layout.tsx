import { Redirect, Stack } from 'expo-router';
import { UserRole } from '@/core/auth/roles';
import { getHomeRouteForRole } from '@/core/auth/routing';
import { AppRoute } from '@/core/navigation/routes';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';

export default function SuperAdminLayout() {
  const status = useAuth.use.status();
  const user = useAuth.use.user();

  if (status !== 'signIn') {
    return <Redirect href={AppRoute.auth.login} />;
  }

  if (!user) {
    return <Redirect href={AppRoute.auth.login} />;
  }

  if (user.role !== UserRole.SUPER_ADMIN) {
    return <Redirect href={getHomeRouteForRole(user.role)} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
