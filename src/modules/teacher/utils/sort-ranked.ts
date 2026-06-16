/**
 * sortRanked — orders leaderboard rows by rating, trend, or name.
 * Pure helper extracted from session-rankings-screen.
 */

import type { RankSortBy } from '../components/rankings/rankings-header';
import type { RankedStudent } from '../types';
import type { TrendIndicator } from '@/shared/performance';

const TREND_ORDER: Record<NonNullable<TrendIndicator>, number> = { up: 3, stable: 2, down: 1 };

export function sortRanked(rows: RankedStudent[], sortBy: RankSortBy): RankedStudent[] {
  const copy = [...rows];
  if (sortBy === 'rating')
    return copy.sort((a, b) => b.averageRating - a.averageRating);
  if (sortBy === 'delta') {
    return copy.sort((a, b) => {
      const da = a.trend == null ? 0 : (TREND_ORDER[a.trend] ?? 0);
      const db = b.trend == null ? 0 : (TREND_ORDER[b.trend] ?? 0);
      return db - da;
    });
  }
  return copy.sort((a, b) => a.studentName.localeCompare(b.studentName));
}
