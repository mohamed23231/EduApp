import { Redirect } from 'expo-router';
import { UserRole } from '@/core/auth/roles';
import { getHomeRouteForRole } from '@/core/auth/routing';
import { AppRoute } from '@/core/navigation/routes';
import { useAuthStore } from '@/features/auth/use-auth-store';

export default function ManagerEntryRoute() {
  const status = useAuthStore.use.status();
  const user = useAuthStore.use.user();
  const onboardingContext = useAuthStore.use.onboardingContext();

  if (status === 'idle') {
    return null;
  }

  if (status !== 'signIn') {
    return <Redirect href={AppRoute.auth.login} />;
  }

  if (user?.role === UserRole.MANAGER) {
    return <Redirect href={AppRoute.manager.dashboard} />;
  }

  if (onboardingContext?.role === UserRole.MANAGER || !user) {
    return <Redirect href={AppRoute.manager.setup} />;
  }

  return <Redirect href={getHomeRouteForRole(user.role)} />;
}
