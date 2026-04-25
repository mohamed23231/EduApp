import { ErrorBoundary } from '@/modules/teacher/components';
import { StudentListScreen } from '@/modules/teacher/screens';

export default function TeacherStudentsTabRoute() {
  return (
    <ErrorBoundary screenName="StudentListScreen">
      <StudentListScreen />
    </ErrorBoundary>
  );
}
