import { Redirect } from 'expo-router';
import { getHomeRouteForRole } from '@/core/auth/routing';
import { AppRoute } from '@/core/navigation/routes';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';
import { OnboardingScreen } from '@/modules/onboarding/screens/onboarding-screen';

export default function OnboardingRoute() {
  const status = useAuth.use.status();
  const user = useAuth.use.user();
  const onboardingContext = useAuth.use.onboardingContext();

  // Wait for hydration to complete before evaluating guards
  if (status === 'idle') {
    return null;
  }

  // Not authenticated → redirect to login
  if (status === 'signOut') {
    return <Redirect href={AppRoute.auth.login} />;
  }

  // Fully authenticated user → redirect to their role dashboard
  if (status === 'signIn' && user) {
    return <Redirect href={getHomeRouteForRole(user.role)} />;
  }

  if (onboardingContext?.role === 'MANAGER') {
    return <Redirect href={AppRoute.manager.setup} />;
  }

  // signIn + user null (onboarding pending) → show onboarding screen
  return <OnboardingScreen />;
}
