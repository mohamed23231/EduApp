import { Redirect } from 'expo-router';
import { AppRoute } from '@/core/navigation/routes';

export default function TeacherSessionsRedirectRoute() {
  return <Redirect href={AppRoute.teacher.sessions as any} />;
}
