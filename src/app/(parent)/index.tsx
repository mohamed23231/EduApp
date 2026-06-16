import { Redirect } from 'expo-router';
import { AppRoute } from '@/core/navigation/routes';

export default function ParentIndexRoute() {
  return <Redirect href={AppRoute.parent.dashboard} />;
}
