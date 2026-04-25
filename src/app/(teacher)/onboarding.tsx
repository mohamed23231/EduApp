import { ErrorBoundary } from '@/modules/teacher/components';
import { OnboardingScreen } from '@/modules/teacher/screens';

export default function OnboardingRoute() {
  return (
    <ErrorBoundary screenName="OnboardingScreen">
      <OnboardingScreen />
    </ErrorBoundary>
  );
}
