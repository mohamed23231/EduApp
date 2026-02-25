import { ErrorBoundary } from '@/modules/teacher/components';
import { SessionCreateScreen } from '@/modules/teacher/screens';

export default function SessionCreateRoute() {
  return (
    <ErrorBoundary screenName="SessionCreateScreen">
      <SessionCreateScreen />
    </ErrorBoundary>
  );
}
