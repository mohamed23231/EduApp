import { Redirect } from 'expo-router';
import { AppRoute } from '@/core/navigation/routes';

export default function ExternalManagerDashboardRoute() {
  return <Redirect href={AppRoute.manager.dashboard} />;
}
