import { Redirect } from 'expo-router';
import { AppRoute } from '@/core/navigation/routes';

export default function IndexRoute() {
  console.log('[IndexRoute] Redirecting to:', AppRoute.auth.login);
  return <Redirect href={AppRoute.auth.login} />;
}
