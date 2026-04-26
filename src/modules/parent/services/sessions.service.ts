import type { CurrentSession, UpcomingSession } from '../types/student.types';
import type { ApiSuccess } from '@/shared/types/api';
import { client } from '@/lib/api/client';
import { unwrapData } from '@/shared/services/api-utils';

/**
 * Phase 8 — parent dashboard live/upcoming session endpoints.
 *
 * Both endpoints return safe empty states (`inSession: false` / `[]`) when
 * the backend has nothing to report; consumers should not treat empty as an
 * error. The 404-tolerant catch below also handles the period BEFORE the
 * backend ships these routes — the dashboard renders the fallback hero in
 * that case.
 */

type BackendCurrentSession = {
  inSession?: boolean;
  sessionInstanceId?: string;
  sessionName?: string;
  teacherName?: string;
  startedAt?: string;
  room?: string;
};

type BackendUpcomingSession = {
  sessionInstanceId: string;
  sessionName: string;
  teacherName: string;
  startsAt: string;
  room?: string;
};

const NO_SESSION: CurrentSession = { inSession: false };

function isMissingEndpointError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null)
    return false;
  const status = (err as { response?: { status?: number } }).response?.status;
  return status === 404 || status === 405;
}

export async function fetchCurrentSession(studentId: string): Promise<CurrentSession> {
  try {
    const response = await client.get<ApiSuccess<BackendCurrentSession> | BackendCurrentSession>(
      `/parents/students/${studentId}/current-session`,
    );
    const data = unwrapData(response.data);
    return {
      inSession: Boolean(data.inSession),
      ...(data.sessionInstanceId ? { sessionInstanceId: data.sessionInstanceId } : {}),
      ...(data.sessionName ? { sessionName: data.sessionName } : {}),
      ...(data.teacherName ? { teacherName: data.teacherName } : {}),
      ...(data.startedAt ? { startedAt: data.startedAt } : {}),
      ...(data.room ? { room: data.room } : {}),
    };
  }
  catch (err) {
    // Endpoint may not exist yet (backend ships in parallel) — fall back silently.
    if (isMissingEndpointError(err))
      return NO_SESSION;
    throw err;
  }
}

export async function fetchUpcomingSessions(
  studentId: string,
  limit: number = 1,
): Promise<UpcomingSession[]> {
  try {
    const response = await client.get<ApiSuccess<BackendUpcomingSession[]> | BackendUpcomingSession[]>(
      `/parents/students/${studentId}/upcoming-sessions`,
      { params: { limit } },
    );
    const data = unwrapData(response.data);
    return Array.isArray(data) ? data : [];
  }
  catch (err) {
    if (isMissingEndpointError(err))
      return [];
    throw err;
  }
}
