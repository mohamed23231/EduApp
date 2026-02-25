import { ErrorBoundary } from '@/modules/teacher/components';
import { StudentEditScreen } from '@/modules/teacher/screens';

export default function StudentEditRoute() {
  return (
    <ErrorBoundary screenName="StudentEditScreen">
      <StudentEditScreen />
    </ErrorBoundary>
  );
}
