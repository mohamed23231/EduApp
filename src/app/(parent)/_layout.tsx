import { Redirect, Slot } from 'expo-router';
import { UserRole } from '@/core/auth/roles';
import { getHomeRouteForRole } from '@/core/auth/routing';
import { AppRoute } from '@/core/navigation/routes';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';

export default function ParentLayout() {
  const status = useAuth.use.status();
  const user = useAuth.use.user();

  if (status === 'idle')
    return null;
  if (status !== 'signIn')
    return <Redirect href={AppRoute.auth.login} />;
  if (!user)
    return <Redirect href={AppRoute.auth.onboarding} />;
  if (user.role !== UserRole.PARENT)
    return <Redirect href={getHomeRouteForRole(user.role)} />;

  return <Slot />;
}
