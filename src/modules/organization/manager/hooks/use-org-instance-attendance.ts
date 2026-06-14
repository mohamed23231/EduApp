import { useQuery } from '@tanstack/react-query';
import { getOrgInstanceAttendance } from '../services/org-api.service';
import { ManagerQueryKey } from './use-manager-org';

export function useOrgInstanceAttendance(orgId: string, instanceId: string) {
  return useQuery({
    queryKey: [...ManagerQueryKey.instance(orgId, instanceId), 'attendance'],
    queryFn: () => getOrgInstanceAttendance(orgId, instanceId),
    enabled: !!orgId && !!instanceId,
  });
}
