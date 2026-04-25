import { ErrorBoundary } from '@/modules/teacher/components';
import { SessionEditScreen } from '@/modules/teacher/screens';

export default function SessionEditRoute() {
  return (
    <ErrorBoundary screenName="SessionEditScreen">
      <SessionEditScreen />
    </ErrorBoundary>
  );
}
