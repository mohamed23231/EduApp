import type { TimelineRecord } from '../types';

export type StatusKey = 'present' | 'absent' | 'excused' | 'none';

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function deriveStatusKey(status: string): StatusKey {
  if (status === 'PRESENT')
    return 'present';
  if (status === 'ABSENT')
    return 'absent';
  if (status === 'EXCUSED')
    return 'excused';
  return 'none';
}

export function deriveTodayRecord(timeline: TimelineRecord[]): TimelineRecord | null {
  if (!timeline.length)
    return null;
  const today = todayKey();
  return timeline.find(r => r.date.slice(0, 10) === today) ?? timeline[0];
}

/**
 * Backend returns `date` as ISO timestamp (e.g. `2026-03-06T00:00:00.000Z`)
 * and `time` as a separate `HH:MM:SS` string. Combine them into a single
 * Date-parseable input that dayjs can format with the active locale.
 */
export function combineDateTime(date: string, time: string): string {
  const datePart = date.includes('T') ? date.slice(0, 10) : date;
  const timePart = time.length === 5 ? `${time}:00` : time;
  return `${datePart}T${timePart}`;
}
