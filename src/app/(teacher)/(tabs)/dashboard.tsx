import { ErrorBoundary } from '@/modules/teacher/components';
import { DashboardScreen } from '@/modules/teacher/screens';

export default function TeacherDashboardTabRoute() {
  return (
    <ErrorBoundary screenName="DashboardScreen">
      <DashboardScreen />
    </ErrorBoundary>
  );
}
