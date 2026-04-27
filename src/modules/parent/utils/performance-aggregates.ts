import type { TimelineRecord } from '../types';
import { combineDateTime, deriveStatusKey } from './dashboard-helpers';

/**
 * Pure aggregation helpers for the redesigned parent performance screen.
 * No JSX, no API calls — input is what we already have on the client.
 */

export type PerformanceLikeRecord = {
  date: string;
  status: string;
  rating: number | null;
  sessionSubject: string;
  teacherName?: string;
  excuseNote?: string | null;
};

export type SubjectAggregate = {
  subject: string;
  totalSessions: number;
  presentCount: number;
  attendanceRate: number;
  ratedCount: number;
  averageRating: number | null;
  teacherName?: string;
};

export type TeacherAggregate = {
  teacherName: string;
  subjects: string[];
  sessionsCount: number;
};

export type WeekBucket = {
  weekIndex: number;
  label: string;
  presentCount: number;
  totalCount: number;
  rate: number;
  isCurrent: boolean;
};

export function groupBySubject(records: PerformanceLikeRecord[]): SubjectAggregate[] {
  const map = new Map<string, SubjectAggregate>();
  for (const r of records) {
    const subject = r.sessionSubject || '—';
    const existing = map.get(subject) ?? {
      subject,
      totalSessions: 0,
      presentCount: 0,
      attendanceRate: 0,
      ratedCount: 0,
      averageRating: null,
      teacherName: r.teacherName,
    };
    existing.totalSessions += 1;
    if (deriveStatusKey(r.status) === 'present')
      existing.presentCount += 1;
    if (typeof r.rating === 'number') {
      const prev = existing.averageRating ?? 0;
      const next = (prev * existing.ratedCount + r.rating) / (existing.ratedCount + 1);
      existing.ratedCount += 1;
      existing.averageRating = Number(next.toFixed(2));
    }
    map.set(subject, existing);
  }
  return Array.from(map.values()).map(s => ({
    ...s,
    attendanceRate: s.totalSessions > 0 ? Math.round((s.presentCount / s.totalSessions) * 100) : 0,
  }));
}

export function distinctTeachers(records: PerformanceLikeRecord[]): TeacherAggregate[] {
  const map = new Map<string, TeacherAggregate>();
  for (const r of records) {
    const name = r.teacherName?.trim();
    if (!name)
      continue;
    const existing = map.get(name) ?? {
      teacherName: name,
      subjects: [],
      sessionsCount: 0,
    };
    existing.sessionsCount += 1;
    if (r.sessionSubject && !existing.subjects.includes(r.sessionSubject))
      existing.subjects.push(r.sessionSubject);
    map.set(name, existing);
  }
  return Array.from(map.values());
}

/**
 * Bucket attendance timeline records into 8 weekly buckets ending today.
 * Bucket 7 (index 7) is the current week. Older weeks have higher distance.
 */
export function weekBuckets(records: TimelineRecord[], weeks: number = 8): WeekBucket[] {
  const now = new Date();
  const startOfCurrentWeek = startOfWeek(now);
  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = addDays(startOfCurrentWeek, -7 * i);
    buckets.push({
      weekIndex: weeks - 1 - i,
      label: `W${weeks - i}`,
      presentCount: 0,
      totalCount: 0,
      rate: 0,
      isCurrent: i === 0,
    });
    void weekStart;
  }
  for (const r of records) {
    const date = new Date(combineDateTime(r.date, r.time));
    const diffDays = Math.floor((startOfCurrentWeek.getTime() - startOfWeek(date).getTime()) / (1000 * 60 * 60 * 24));
    const weeksAgo = Math.floor(diffDays / 7);
    if (weeksAgo < 0 || weeksAgo >= weeks)
      continue;
    const bucket = buckets[weeks - 1 - weeksAgo];
    bucket.totalCount += 1;
    if (deriveStatusKey(r.status) === 'present')
      bucket.presentCount += 1;
  }
  return buckets.map(b => ({
    ...b,
    rate: b.totalCount > 0 ? Math.round((b.presentCount / b.totalCount) * 100) : 0,
  }));
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
