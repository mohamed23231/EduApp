import { Redirect } from 'expo-router';
import { AppRoute } from '@/core/navigation/routes';

export default function ExternalManagerSetupRoute() {
  return <Redirect href={AppRoute.manager.setup} />;
}
