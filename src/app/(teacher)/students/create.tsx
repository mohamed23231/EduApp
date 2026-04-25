import { ErrorBoundary } from '@/modules/teacher/components';
import { StudentCreateScreen } from '@/modules/teacher/screens';

export default function StudentCreateRoute() {
  return (
    <ErrorBoundary screenName="StudentCreateScreen">
      <StudentCreateScreen />
    </ErrorBoundary>
  );
}
