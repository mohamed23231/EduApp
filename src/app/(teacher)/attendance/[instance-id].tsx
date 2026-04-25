import { ErrorBoundary } from '@/modules/teacher/components';
import { AttendanceSheetScreen } from '@/modules/teacher/screens';

export default function AttendanceSheetRoute() {
  return (
    <ErrorBoundary screenName="AttendanceSheetScreen">
      <AttendanceSheetScreen />
    </ErrorBoundary>
  );
}
