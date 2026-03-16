import type {
  CreateOrganizationInput,
  CreateSessionInput,
  CreateStudentInput,
  InviteTeacherInput,
  MarkAttendanceInput,
  UpdateStudentInput,
} from '../types/manager.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelOrgInvitation,
  closeOrgInstance,
  createOrganization,
  createOrgSession,
  createOrgStudent,
  deleteOrgSession,
  deleteOrgStudent,
  getOrganization,
  getOrgInstance,
  getOrgSession,
  getOrgStatsOverview,
  getOrgStudent,
  getOrgStudentStats,
  getOrgTeacherStats,
  inviteTeacher,
  listOrganizations,
  listOrgInstances,
  listOrgInvitations,
  listOrgMembers,
  listOrgSessions,
  listOrgStudents,
  markOrgAttendance,
  pauseOrgSession,
  regenerateStudentCode,
  removeOrgMember,
  resendOrgInvitation,
  resumeOrgSession,
  startOrgInstance,
  updateOrganization,
  updateOrgSession,
  updateOrgStudent,
} from '../services/org-api.service';

export const ManagerQueryKey = {
  organizations: ['manager', 'organizations'] as const,
  organization: (orgId: string) => ['manager', 'organization', orgId] as const,
  students: (orgId: string, search?: string) =>
    ['manager', 'students', orgId, search ?? ''] as const,
  members: (orgId: string) => ['manager', 'members', orgId] as const,
  invitations: (orgId: string) => ['manager', 'invitations', orgId] as const,
  sessions: (orgId: string) => ['manager', 'sessions', orgId] as const,
  session: (orgId: string, sessionId: string) =>
    ['manager', 'session', orgId, sessionId] as const,
  instances: (orgId: string, params?: { date?: string; from?: string; to?: string }) =>
    ['manager', 'instances', orgId, params?.date ?? '', params?.from ?? '', params?.to ?? ''] as const,
  instance: (orgId: string, instanceId: string) =>
    ['manager', 'instance', orgId, instanceId] as const,
  statsOverview: (orgId: string, range?: string) =>
    ['manager', 'stats-overview', orgId, range ?? 'month'] as const,
  student: (orgId: string, studentId: string) =>
    ['manager', 'student', orgId, studentId] as const,
  studentStats: (orgId: string, studentId: string, range?: string) =>
    ['manager', 'student-stats', orgId, studentId, range ?? 'month'] as const,
  statsTeachers: (orgId: string, range?: string) =>
    ['manager', 'stats-teachers', orgId, range ?? 'month'] as const,
} as const;

export function useOrganizations() {
  return useQuery({
    queryKey: ManagerQueryKey.organizations,
    queryFn: listOrganizations,
  });
}

export function useOrganization(orgId?: string | null) {
  return useQuery({
    queryKey: orgId ? ManagerQueryKey.organization(orgId) : ['manager', 'organization', 'empty'],
    queryFn: () => getOrganization(orgId!),
    enabled: Boolean(orgId),
  });
}

export function useCreateOrg() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrganizationInput) => createOrganization(input),
    onSuccess: (organization) => {
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.organizations });
      queryClient.setQueryData(
        ManagerQueryKey.organization(organization.id),
        organization,
      );
    },
  });
}

export function useUpdateOrg() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, input }: { orgId: string; input: Partial<CreateOrganizationInput> }) =>
      updateOrganization(orgId, input),
    onSuccess: (organization) => {
      queryClient.setQueryData(
        ManagerQueryKey.organization(organization.id),
        organization,
      );
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.organizations });
    },
  });
}

type OrgStudentsFilters = {
  search?: string;
  gradeLevel?: string;
  page?: number;
  limit?: number;
};

export function useOrgStudents(
  orgId?: string | null,
  filters?: OrgStudentsFilters,
) {
  const { search, gradeLevel, page = 1, limit = 20 } = filters ?? {};
  return useQuery({
    queryKey: orgId
      ? [...ManagerQueryKey.students(orgId, search), gradeLevel ?? '', page, limit]
      : ['manager', 'students', 'empty'],
    queryFn: () => listOrgStudents(orgId!, { search, gradeLevel, page, limit }),
    enabled: Boolean(orgId),
  });
}

export function useCreateStudent(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStudentInput) => createOrgStudent(orgId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.students(orgId!) });
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.organization(orgId!) });
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.statsOverview(orgId!) });
    },
  });
}

export function useUpdateStudent(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, input }: { studentId: string; input: UpdateStudentInput }) =>
      updateOrgStudent(orgId!, studentId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.students(orgId!) });
    },
  });
}

export function useDeleteStudent(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) => deleteOrgStudent(orgId!, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.students(orgId!) });
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.organization(orgId!) });
    },
  });
}

export function useRegenerateStudentCode(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) => regenerateStudentCode(orgId!, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.students(orgId!) });
    },
  });
}

export function useOrgMembers(orgId?: string | null) {
  return useQuery({
    queryKey: orgId ? ManagerQueryKey.members(orgId) : ['manager', 'members', 'empty'],
    queryFn: () => listOrgMembers(orgId!),
    enabled: Boolean(orgId),
  });
}

export function useInviteTeacher(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteTeacherInput) => inviteTeacher(orgId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.members(orgId!) });
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.invitations(orgId!) });
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.organization(orgId!) });
    },
  });
}

export function useRemoveMember(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => removeOrgMember(orgId!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.members(orgId!) });
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.sessions(orgId!) });
    },
  });
}

export function useOrgInvitations(orgId?: string | null) {
  return useQuery({
    queryKey: orgId ? ManagerQueryKey.invitations(orgId) : ['manager', 'invitations', 'empty'],
    queryFn: () => listOrgInvitations(orgId!),
    enabled: Boolean(orgId),
  });
}

export function useCancelInvitation(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => cancelOrgInvitation(orgId!, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.invitations(orgId!) });
    },
  });
}

export function useResendInvitation(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => resendOrgInvitation(orgId!, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.invitations(orgId!) });
    },
  });
}

export function useOrgSessions(orgId?: string | null) {
  return useQuery({
    queryKey: orgId ? ManagerQueryKey.sessions(orgId) : ['manager', 'sessions', 'empty'],
    queryFn: () => listOrgSessions(orgId!),
    enabled: Boolean(orgId),
  });
}

export function useOrgSession(orgId?: string | null, sessionId?: string | null) {
  return useQuery({
    queryKey:
      orgId && sessionId
        ? ManagerQueryKey.session(orgId, sessionId)
        : ['manager', 'session', 'empty'],
    queryFn: () => getOrgSession(orgId!, sessionId!),
    enabled: Boolean(orgId && sessionId),
  });
}

export function useCreateSession(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSessionInput) => createOrgSession(orgId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.sessions(orgId!) });
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.organization(orgId!) });
    },
  });
}

export function useDeleteSession(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => deleteOrgSession(orgId!, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.sessions(orgId!) });
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.organization(orgId!) });
    },
  });
}

export function useUpdateSession(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      input,
    }: {
      sessionId: string;
      input: Partial<CreateSessionInput> & { isPaused?: boolean };
    }) => updateOrgSession(orgId!, sessionId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.sessions(orgId!) });
      queryClient.invalidateQueries({
        queryKey: ManagerQueryKey.session(orgId!, variables.sessionId),
      });
    },
  });
}

export function usePauseResumeSession(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      isPaused,
    }: {
      sessionId: string;
      isPaused: boolean;
    }) => (isPaused ? resumeOrgSession(orgId!, sessionId) : pauseOrgSession(orgId!, sessionId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.sessions(orgId!) });
    },
  });
}

export function useOrgInstances(
  orgId?: string | null,
  params?: { date?: string; from?: string; to?: string },
) {
  return useQuery({
    queryKey:
      orgId
        ? ManagerQueryKey.instances(orgId, params)
        : ['manager', 'instances', 'empty'],
    queryFn: () => listOrgInstances(orgId!, params),
    enabled: Boolean(orgId),
  });
}

export function useOrgInstance(orgId?: string | null, instanceId?: string | null) {
  return useQuery({
    queryKey:
      orgId && instanceId
        ? ManagerQueryKey.instance(orgId, instanceId)
        : ['manager', 'instance', 'empty'],
    queryFn: () => getOrgInstance(orgId!, instanceId!),
    enabled: Boolean(orgId && instanceId),
  });
}

export function useStartSession(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: string) => startOrgInstance(orgId!, instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'instances', orgId!] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'instance', orgId!] });
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.statsOverview(orgId!) });
    },
  });
}

export function useCloseSession(orgId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: string) => closeOrgInstance(orgId!, instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'instances', orgId!] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'instance', orgId!] });
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.statsOverview(orgId!) });
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.statsTeachers(orgId!) });
    },
  });
}

export function useMarkAttendance(orgId?: string | null, instanceId?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MarkAttendanceInput) => markOrgAttendance(orgId!, instanceId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'instances', orgId!] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'instance', orgId!] });
      queryClient.invalidateQueries({ queryKey: ManagerQueryKey.statsOverview(orgId!) });
    },
  });
}

export function useOrgStudent(orgId?: string | null, studentId?: string | null) {
  return useQuery({
    queryKey:
      orgId && studentId
        ? ManagerQueryKey.student(orgId, studentId)
        : ['manager', 'student', 'empty'],
    queryFn: () => getOrgStudent(orgId!, studentId!),
    enabled: Boolean(orgId && studentId),
  });
}

export function useOrgStudentStats(
  orgId?: string | null,
  studentId?: string | null,
  range = 'month',
) {
  return useQuery({
    queryKey:
      orgId && studentId
        ? ManagerQueryKey.studentStats(orgId, studentId, range)
        : ['manager', 'student-stats', 'empty'],
    queryFn: () => getOrgStudentStats(orgId!, studentId!, { range }),
    enabled: Boolean(orgId && studentId),
  });
}

export function useOrgStats(orgId?: string | null, range = 'month') {
  const overview = useQuery({
    queryKey: orgId ? ManagerQueryKey.statsOverview(orgId, range) : ['manager', 'stats-overview', 'empty'],
    queryFn: () => getOrgStatsOverview(orgId!, { range }),
    enabled: Boolean(orgId),
  });

  const teachers = useQuery({
    queryKey: orgId ? ManagerQueryKey.statsTeachers(orgId, range) : ['manager', 'stats-teachers', 'empty'],
    queryFn: () => getOrgTeacherStats(orgId!, { range }),
    enabled: Boolean(orgId),
  });

  return { overview, teachers };
}
