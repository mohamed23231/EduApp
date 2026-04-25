import { ErrorBoundary } from '@/modules/teacher/components';
import { ConnectionCodeScreen } from '@/modules/teacher/screens';

export default function ConnectionCodeRoute() {
  return (
    <ErrorBoundary screenName="ConnectionCodeScreen">
      <ConnectionCodeScreen />
    </ErrorBoundary>
  );
}
