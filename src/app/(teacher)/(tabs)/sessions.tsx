import { ErrorBoundary } from '@/modules/teacher/components';
import { SessionListScreen } from '@/modules/teacher/screens';

export default function TeacherSessionsTabRoute() {
  return (
    <ErrorBoundary screenName="SessionListScreen">
      <SessionListScreen />
    </ErrorBoundary>
  );
}
