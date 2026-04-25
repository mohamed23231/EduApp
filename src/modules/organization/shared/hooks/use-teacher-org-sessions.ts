import type { MarkAttendanceEntry } from '../services/teacher-org-api.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  closeOrgInstance,
  listMyOrgInstances,
  markOrgAttendance,
  startOrgInstance,
} from '../services/teacher-org-api.service';

export const TeacherOrgQueryKey = {
  instances: (orgId: string) => ['teacher-org', 'instances', orgId] as const,
} as const;

export function useMyOrgInstances(orgId: string | null, date?: string) {
  return useQuery({
    queryKey: orgId ? TeacherOrgQueryKey.instances(orgId) : ['teacher-org', 'instances', 'empty'],
    queryFn: () => listMyOrgInstances(orgId!, date ? { date } : {}),
    enabled: Boolean(orgId),
  });
}

export function useStartOrgInstance(orgId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: string) => startOrgInstance(orgId!, instanceId),
    onSuccess: () => {
      if (orgId) {
        void queryClient.invalidateQueries({ queryKey: TeacherOrgQueryKey.instances(orgId) });
      }
    },
  });
}

export function useCloseOrgInstance(orgId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: string) => closeOrgInstance(orgId!, instanceId),
    onSuccess: () => {
      if (orgId) {
        void queryClient.invalidateQueries({ queryKey: TeacherOrgQueryKey.instances(orgId) });
      }
    },
  });
}

export function useMarkOrgAttendance(orgId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, records }: { instanceId: string; records: MarkAttendanceEntry[] }) =>
      markOrgAttendance(orgId!, instanceId, records),
    onSuccess: () => {
      if (orgId) {
        void queryClient.invalidateQueries({ queryKey: TeacherOrgQueryKey.instances(orgId) });
      }
    },
  });
}
