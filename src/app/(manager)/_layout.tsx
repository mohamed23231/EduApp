import { Redirect, Stack } from 'expo-router';
import { UserRole } from '@/core/auth/roles';
import { getHomeRouteForRole } from '@/core/auth/routing';
import { AppRoute } from '@/core/navigation/routes';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';

export default function ManagerLayout() {
  const status = useAuth.use.status();
  const user = useAuth.use.user();
  const onboardingContext = useAuth.use.onboardingContext();

  if (status === 'idle') {
    return null;
  }

  if (status !== 'signIn') {
    return <Redirect href={AppRoute.auth.login} />;
  }

  if (!user) {
    if (onboardingContext?.role === UserRole.MANAGER) {
      return (
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 250,
          }}
        />
      );
    }
    return <Redirect href={AppRoute.auth.onboarding} />;
  }

  if (user.role !== UserRole.MANAGER) {
    return <Redirect href={getHomeRouteForRole(user.role)} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 250,
      }}
    />
  );
}
