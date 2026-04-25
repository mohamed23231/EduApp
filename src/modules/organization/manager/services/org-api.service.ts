import type {
  CreateOrganizationInput,
  CreateSessionInput,
  CreateStudentInput,
  InviteTeacherInput,
  MarkAttendanceInput,
  OrganizationDetails,
  OrganizationSummary,
  OrgInvitation,
  OrgMember,
  OrgSessionInstance,
  OrgSessionTemplate,
  OrgStatsOverview,
  OrgStudent,
  OrgStudentDetail,
  OrgStudentStats,
  OrgTeacherStatsItem,
  PaginationMeta,
  UpdateStudentInput,
} from '../types/manager.types';
import type { ApiSuccess } from '@/shared/types/api';
import { client } from '@/lib/api/client';
import { unwrapData } from '@/shared/services/api-utils';

type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

type TeacherStatsResponse = {
  data: OrgTeacherStatsItem[];
};

type MarkAttendanceResponse = {
  marked: number;
  records: Array<{
    id: string;
    studentId: string;
    status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
    excuseNote?: string | null;
    rating?: number | null;
  }>;
};

function withQuery(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
) {
  const params = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return;
    }
    params.set(key, String(value));
  });

  const serialized = params.toString();
  return serialized ? `${path}?${serialized}` : path;
}

export async function createOrganization(input: CreateOrganizationInput) {
  const response = await client.post<ApiSuccess<OrganizationDetails> | OrganizationDetails>(
    '/orgs',
    input,
  );
  return unwrapData(response.data);
}

export async function listOrganizations() {
  const response = await client.get<
    ApiSuccess<PaginatedResponse<OrganizationSummary>> | PaginatedResponse<OrganizationSummary>
  >('/orgs');
  return unwrapData(response.data);
}

export async function getOrganization(orgId: string) {
  const response = await client.get<ApiSuccess<OrganizationDetails> | OrganizationDetails>(
    `/orgs/${orgId}`,
  );
  return unwrapData(response.data);
}

export async function updateOrganization(
  orgId: string,
  input: Partial<CreateOrganizationInput>,
) {
  const response = await client.patch<
    ApiSuccess<OrganizationDetails> | OrganizationDetails
  >(`/orgs/${orgId}`, input);
  return unwrapData(response.data);
}

export async function listOrgStudents(
  orgId: string,
  query?: Record<string, string | number | boolean | undefined>,
) {
  const response = await client.get<
    ApiSuccess<PaginatedResponse<OrgStudent>> | PaginatedResponse<OrgStudent>
  >(withQuery(`/orgs/${orgId}/students`, query));
  return unwrapData(response.data);
}

export async function getOrgStudent(orgId: string, studentId: string) {
  const response = await client.get<ApiSuccess<OrgStudentDetail> | OrgStudentDetail>(
    `/orgs/${orgId}/students/${studentId}`,
  );
  return unwrapData(response.data);
}

export async function createOrgStudent(orgId: string, input: CreateStudentInput) {
  const response = await client.post<ApiSuccess<OrgStudent> | OrgStudent>(
    `/orgs/${orgId}/students`,
    input,
  );
  return unwrapData(response.data);
}

export async function updateOrgStudent(
  orgId: string,
  studentId: string,
  input: UpdateStudentInput,
) {
  const response = await client.patch<ApiSuccess<OrgStudent> | OrgStudent>(
    `/orgs/${orgId}/students/${studentId}`,
    input,
  );
  return unwrapData(response.data);
}

export async function deleteOrgStudent(orgId: string, studentId: string) {
  const response = await client.delete(`/orgs/${orgId}/students/${studentId}`);
  return unwrapData(response.data);
}

export async function regenerateStudentCode(orgId: string, studentId: string) {
  const response = await client.post<ApiSuccess<OrgStudent> | OrgStudent>(
    `/orgs/${orgId}/students/${studentId}/regenerate-code`,
  );
  return unwrapData(response.data);
}

export async function listOrgMembers(orgId: string) {
  const response = await client.get<
    ApiSuccess<PaginatedResponse<OrgMember>> | PaginatedResponse<OrgMember>
  >(`/orgs/${orgId}/members`);
  return unwrapData(response.data);
}

export async function inviteTeacher(orgId: string, input: InviteTeacherInput) {
  const response = await client.post(`/orgs/${orgId}/members`, input);
  return unwrapData(response.data);
}

export async function removeOrgMember(orgId: string, memberId: string) {
  const response = await client.delete(`/orgs/${orgId}/members/${memberId}`);
  return unwrapData(response.data);
}

export async function listOrgInvitations(orgId: string) {
  const response = await client.get<
    ApiSuccess<PaginatedResponse<OrgInvitation>> | PaginatedResponse<OrgInvitation>
  >(withQuery(`/orgs/${orgId}/invitations`, { status: 'PENDING' }));
  return unwrapData(response.data);
}

export async function cancelOrgInvitation(orgId: string, invitationId: string) {
  const response = await client.delete(`/orgs/${orgId}/invitations/${invitationId}`);
  return unwrapData(response.data);
}

export async function resendOrgInvitation(orgId: string, invitationId: string) {
  const response = await client.post(`/orgs/${orgId}/invitations/${invitationId}/resend`);
  return unwrapData(response.data);
}

export async function listOrgSessions(
  orgId: string,
  query?: Record<string, string | number | boolean | undefined>,
) {
  const response = await client.get<
    ApiSuccess<PaginatedResponse<OrgSessionTemplate>> | PaginatedResponse<OrgSessionTemplate>
  >(withQuery(`/orgs/${orgId}/sessions`, query));
  return unwrapData(response.data);
}

export async function getOrgSession(orgId: string, sessionId: string) {
  const response = await client.get<ApiSuccess<OrgSessionTemplate> | OrgSessionTemplate>(
    `/orgs/${orgId}/sessions/${sessionId}`,
  );
  return unwrapData(response.data);
}

export async function createOrgSession(orgId: string, input: CreateSessionInput) {
  const response = await client.post<ApiSuccess<OrgSessionTemplate> | OrgSessionTemplate>(
    `/orgs/${orgId}/sessions`,
    input,
  );
  return unwrapData(response.data);
}

export async function updateOrgSession(
  orgId: string,
  sessionId: string,
  input: Partial<CreateSessionInput> & { isPaused?: boolean },
) {
  const response = await client.patch<ApiSuccess<OrgSessionTemplate> | OrgSessionTemplate>(
    `/orgs/${orgId}/sessions/${sessionId}`,
    input,
  );
  return unwrapData(response.data);
}

export async function pauseOrgSession(orgId: string, sessionId: string) {
  const response = await client.post(`/orgs/${orgId}/sessions/${sessionId}/pause`);
  return unwrapData(response.data);
}

export async function resumeOrgSession(orgId: string, sessionId: string) {
  const response = await client.post(`/orgs/${orgId}/sessions/${sessionId}/resume`);
  return unwrapData(response.data);
}

export async function deleteOrgSession(orgId: string, sessionId: string) {
  const response = await client.delete(`/orgs/${orgId}/sessions/${sessionId}`);
  return unwrapData(response.data);
}

export async function listOrgInstances(
  orgId: string,
  query?: Record<string, string | number | boolean | undefined>,
) {
  const response = await client.get<
    ApiSuccess<PaginatedResponse<OrgSessionInstance>> | PaginatedResponse<OrgSessionInstance>
  >(withQuery(`/orgs/${orgId}/instances`, query));
  return unwrapData(response.data);
}

export async function getOrgInstance(orgId: string, instanceId: string) {
  const response = await client.get<ApiSuccess<OrgSessionInstance> | OrgSessionInstance>(
    `/orgs/${orgId}/instances/${instanceId}`,
  );
  return unwrapData(response.data);
}

export async function startOrgInstance(orgId: string, instanceId: string) {
  const response = await client.post<ApiSuccess<OrgSessionInstance> | OrgSessionInstance>(
    `/orgs/${orgId}/instances/${instanceId}/start`,
  );
  return unwrapData(response.data);
}

export async function closeOrgInstance(orgId: string, instanceId: string) {
  const response = await client.post<
    ApiSuccess<{ id: string; state: string; endedAt: string; autoAbsentCount: number }>
    | { id: string; state: string; endedAt: string; autoAbsentCount: number }
  >(`/orgs/${orgId}/instances/${instanceId}/close`);
  return unwrapData(response.data);
}

export async function markOrgAttendance(
  orgId: string,
  instanceId: string,
  input: MarkAttendanceInput,
) {
  const response = await client.post<
    ApiSuccess<MarkAttendanceResponse> | MarkAttendanceResponse
  >(`/orgs/${orgId}/instances/${instanceId}/attendance`, input);
  return unwrapData(response.data);
}

export async function getOrgStatsOverview(
  orgId: string,
  query?: Record<string, string | number | boolean | undefined>,
) {
  const response = await client.get<ApiSuccess<OrgStatsOverview> | OrgStatsOverview>(
    withQuery(`/orgs/${orgId}/stats/overview`, query),
  );
  return unwrapData(response.data);
}

export async function getOrgTeacherStats(
  orgId: string,
  query?: Record<string, string | number | boolean | undefined>,
) {
  const response = await client.get<
    ApiSuccess<TeacherStatsResponse> | TeacherStatsResponse
  >(withQuery(`/orgs/${orgId}/stats/teachers`, query));
  return unwrapData(response.data);
}

export async function getOrgStudentStats(
  orgId: string,
  studentId: string,
  query?: Record<string, string | number | boolean | undefined>,
) {
  const response = await client.get<ApiSuccess<OrgStudentStats> | OrgStudentStats>(
    withQuery(`/orgs/${orgId}/stats/students/${studentId}`, query),
  );
  return unwrapData(response.data);
}
