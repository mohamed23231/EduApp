import { Redirect } from 'expo-router';
import { AppRoute } from '@/core/navigation/routes';

export default function StudentListRoute() {
  return <Redirect href={AppRoute.teacher.students} />;
}
