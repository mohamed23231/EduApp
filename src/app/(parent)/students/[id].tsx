import { StudentDetailsScreen } from '@/modules/parent/screens';

/**
 * Student Details Route
 * Renders the StudentDetailsScreen component for viewing a specific student's details
 * Route: /(parent)/students/[id]
 * Validates: Requirements 11.1, 11.2
 */
export default function StudentDetailsRoute() {
  return <StudentDetailsScreen />;
}
