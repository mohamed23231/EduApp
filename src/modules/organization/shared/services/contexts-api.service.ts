import type { ApiSuccess } from '@/shared/types/api';
import { client } from '@/lib/api/client';
import { unwrapData } from '@/shared/services/api-utils';

export type OrgContextEntry = {
  membershipId: string;
  organizationId: string;
  role: 'OWNER' | 'TEACHER';
  name: string;
  slug: string;
};

export type PendingInvitation = {
  id: string;
  organizationId: string;
  organizationName: string;
  managerName: string;
  inviteeEmail: string | null;
  inviteePhone: string | null;
  expiresAt: string;
  status: string;
};

export type ContextsResponse = {
  independent: { teacherProfileId: string } | null;
  organizations: OrgContextEntry[];
  pendingInvitations: PendingInvitation[];
  userRole: string | null;
};

export async function getContexts() {
  const response = await client.get<ApiSuccess<ContextsResponse> | ContextsResponse>('/me/contexts');
  return unwrapData(response.data);
}

export async function acceptInvitationByToken(token: string) {
  const response = await client.post<ApiSuccess<unknown> | unknown>(`/orgs/invitations/${token}/accept`);
  return unwrapData(response.data);
}

export async function acceptInvitationById(invitationId: string) {
  const response = await client.post<ApiSuccess<unknown> | unknown>(`/me/invitations/${invitationId}/accept`);
  return unwrapData(response.data);
}

export async function declineInvitationById(invitationId: string) {
  const response = await client.post<ApiSuccess<unknown> | unknown>(`/me/invitations/${invitationId}/decline`);
  return unwrapData(response.data);
}
