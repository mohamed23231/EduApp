import { Redirect } from 'expo-router';
import { AppRoute } from '@/core/navigation/routes';

export default function Dashboard() {
  return <Redirect href={AppRoute.teacher.dashboard} />;
}
