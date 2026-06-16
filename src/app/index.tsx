import { Redirect } from 'expo-router';
import { AppRoute } from '@/core/navigation/routes';

export default function IndexRoute() {
  return <Redirect href={AppRoute.auth.login} />;
}
