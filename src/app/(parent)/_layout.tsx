import { Redirect, Slot } from 'expo-router';
import { useEffect } from 'react';
import { UserRole } from '@/core/auth/roles';
import { getHomeRouteForRole } from '@/core/auth/routing';
import { AppRoute } from '@/core/navigation/routes';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';
import { registerPushToken, usePushNotificationHandler, usePushPermissionDetection } from '@/modules/parent/services/push-notification-handler';

export default function ParentLayout() {
  const status = useAuth.use.status();
  const user = useAuth.use.user();

  // Initialize push notification handlers
  usePushNotificationHandler();
  usePushPermissionDetection();

  // Register push token after auth is ready
  useEffect(() => {
    if (status === 'signIn' && user?.role === UserRole.PARENT) {
      void registerPushToken();
    }
  }, [status, user]);

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
