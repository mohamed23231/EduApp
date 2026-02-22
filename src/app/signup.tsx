import { Redirect } from 'expo-router';
import { getHomeRouteForRole } from '@/core/auth/routing';
import { AppRoute } from '@/core/navigation/routes';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';
import { SignupScreen } from '@/modules/auth/screens/signup-screen';

export default function SignupRoute() {
  const status = useAuth.use.status();
  const user = useAuth.use.user();

  // Wait for hydration to complete before evaluating guards
  if (status === 'idle') {
    return null;
  }

  // Fully authenticated user → redirect to their role dashboard
  if (status === 'signIn' && user) {
    return <Redirect href={getHomeRouteForRole(user.role)} />;
  }

  // Signed in but onboarding pending → redirect to onboarding
  if (status === 'signIn' && !user) {
    return <Redirect href={AppRoute.auth.onboarding} />;
  }

  // signOut → show signup screen
  return <SignupScreen />;
}
