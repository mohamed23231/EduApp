import { ErrorBoundary } from '@/modules/teacher/components';
import { TeacherProfileScreen } from '@/modules/teacher/screens';

export default function TeacherProfileTabRoute() {
  return (
    <ErrorBoundary screenName="TeacherProfileScreen">
      <TeacherProfileScreen />
    </ErrorBoundary>
  );
}
