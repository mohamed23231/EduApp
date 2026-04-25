import { Redirect } from 'expo-router';
import { AppRoute } from '@/core/navigation/routes';

// Backward-compatible route shim for older links still pointing to /(parent)/dashboard.
export default function ParentDashboardLegacyRoute() {
  return <Redirect href={AppRoute.parent.dashboard} />;
}
