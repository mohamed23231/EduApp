import { Redirect, Stack } from 'expo-router';
import { UserRole } from '@/core/auth/roles';
import { getHomeRouteForRole } from '@/core/auth/routing';
import { AppRoute } from '@/core/navigation/routes';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';

export default function TeacherLayout() {
  const status = useAuth.use.status();
  const user = useAuth.use.user();

  // Wait for hydration to complete before evaluating guards
  if (status === 'idle') {
    return null;
  }

  // Not authenticated → redirect to login
  if (status !== 'signIn') {
    return <Redirect href={AppRoute.auth.login} />;
  }

  // Authenticated but onboarding pending → redirect to onboarding
  if (!user) {
    return <Redirect href={AppRoute.auth.onboarding} />;
  }

  // Wrong role → redirect to the correct role dashboard
  if (user.role !== UserRole.TEACHER) {
    return <Redirect href={getHomeRouteForRole(user.role)} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
