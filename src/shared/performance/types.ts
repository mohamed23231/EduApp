/**
 * Shared performance analytics types — usable by both parent and teacher modules.
 * Validates: Requirements 22.9, 25.7
 */

import type { AttendanceStatus } from '@/modules/teacher/types';

export type WindowFilter = 'last_5' | 'last_10' | 'all';

export type TrendIndicator = 'up' | 'down' | 'stable' | null;

export type PerformanceRecord = {
  sessionInstanceId: string;
  date: string;
  status: AttendanceStatus;
  rating: number | null;
  sessionSubject: string;
  teacherName: string;
  excuseNote?: string | null;
};

export type PerformanceSummary = {
  averageRating: number | null;
  highestRating: number | null;
  lowestRating: number | null;
  ratedSessionsCount: number;
  totalSessionsCount: number;
};

export type PerformanceResponse = {
  summary: PerformanceSummary;
  records: PerformanceRecord[];
  filter?: { window: WindowFilter };
  nextCursor: string | null;
};

export type LowScoreHighlight = {
  sessionInstanceId: string;
  date: string;
  rating: number;
  sessionSubject: string;
};

export type ParentPerformanceResponse = {
  summary: PerformanceSummary;
  records: PerformanceRecord[];
  lowScoreHighlights: LowScoreHighlight[];
  filter?: { window: WindowFilter };
  nextCursor: string | null;
};
