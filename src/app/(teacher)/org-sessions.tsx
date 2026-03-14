import { useLocalSearchParams } from 'expo-router';
import { TeacherOrgSessionsScreen } from '@/modules/organization/shared/screens/teacher-org-sessions-screen';

export default function TeacherOrgSessionsRoute() {
  const { orgId, orgName } = useLocalSearchParams<{ orgId: string; orgName: string }>();
  return <TeacherOrgSessionsScreen orgId={orgId ?? ''} orgName={orgName ?? ''} />;
}
