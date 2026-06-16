/**
 * SessionRankingsScreen — Phase-9 restyled leaderboard.
 * Three buckets: Top performers (≥7), Mid pack (0–6), Not yet rated.
 * Sort tabs: rating / delta / name.
 * Window filter row (last_5 / last_10 / all) kept above sort tabs.
 */

import type { RankSortBy } from '../components/rankings/rankings-header';
import type { WindowFilter } from '../types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, ErrorState } from '@/components/ui';
import colors from '@/components/ui/colors';
import { AppRoute } from '@/core/navigation/routes';
import { FilterChips } from '../components';
import { BackHeader } from '../components/back-header';
import { RankRow, UnratedRow } from '../components/rankings/rank-rows';
import { RankingsHero, RankSectionLabel, RankSortTabs } from '../components/rankings/rankings-header';
import { RankingsSkeleton } from '../components/rankings/rankings-skeleton';
import { useSessionRankings } from '../hooks';
import { sortRanked } from '../utils/sort-ranked';

const WINDOW_OPTIONS: { key: WindowFilter; labelKey: string }[] = [
  { key: 'last_5', labelKey: 'teacher.rankings.filterLast5' },
  { key: 'last_10', labelKey: 'teacher.rankings.filterLast10' },
  { key: 'all', labelKey: 'teacher.rankings.filterAll' },
];

// eslint-disable-next-line max-lines-per-function
export function SessionRankingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ templateId?: string; id?: string }>();
  const templateId = (params.templateId ?? params.id) as string;
  const [windowFilter, setWindowFilter] = useState<WindowFilter>('all');
  const [sortBy, setSortBy] = useState<RankSortBy>('rating');

  const { data, isLoading, isError, refetch } = useSessionRankings(templateId, windowFilter);

  const filterOptions = WINDOW_OPTIONS.map(o => ({ key: o.key, label: t(o.labelKey) }));
  const navigateToStudent = (studentId: string) => {
    router.push(AppRoute.teacher.studentPerformance(studentId) as any);
  };

  const ranked = data?.rankings ?? [];
  const unrated = data?.insufficientData ?? [];
  const sorted = sortRanked(ranked, sortBy);
  const top = sorted.filter(r => r.averageRating >= 7);
  const mid = sorted.filter(r => r.averageRating < 7);
  const totalStudents = data?.summary.totalStudents ?? 0;
  const avg = ranked.length > 0
    ? (ranked.reduce((s, r) => s + r.averageRating, 0) / ranked.length).toFixed(1)
    : '—';
  const isEmpty = ranked.length === 0 && unrated.length === 0;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      <BackHeader
        title={t('teacher.rankings.topStudents', 'Rankings')}
        onBack={() => router.back()}
        backLabel={t('teacher.common.back')}
      />

      {isLoading && <RankingsSkeleton />}

      {isError && (
        <View className="flex-1 items-center justify-center">
          <ErrorState
            title={t('teacher.common.errorTitle', 'Something went wrong')}
            body={t('teacher.common.genericError')}
            action={{ label: t('teacher.common.retry'), onPress: () => refetch() }}
          />
        </View>
      )}

      {!isLoading && !isError && (
        <ScrollView contentContainerStyle={{ paddingBottom: 40, flexGrow: isEmpty ? 1 : 0 }}>
          {data && (
            <View className="pt-4 pb-3">
              <RankingsHero
                subject={data.summary.templateSubject}
                ratedCount={ranked.length}
                totalCount={totalStudents}
                avg={avg}
              />
            </View>
          )}

          <FilterChips
            options={filterOptions}
            selected={windowFilter}
            onSelect={v => setWindowFilter(v as WindowFilter)}
          />
          <RankSortTabs active={sortBy} onChange={setSortBy} />

          {top.length > 0 && (
            <View className="mb-3 px-4">
              <RankSectionLabel label={`${t('teacher.rankings.topStudents', 'Top performers')} · ${top.length}`} accent={colors.brand.primary} />
              <View className="gap-1.5">
                {top.map((r, i) => (
                  <RankRow key={r.studentId} idx={i + 1} row={r} highlight onPress={() => navigateToStudent(r.studentId)} />
                ))}
              </View>
            </View>
          )}

          {mid.length > 0 && (
            <View className="mb-3 px-4">
              <RankSectionLabel label={`${t('teacher.rankings.midPack', 'Mid pack')} · ${mid.length}`} />
              <View className="gap-1.5">
                {mid.map((r, i) => (
                  <RankRow key={r.studentId} idx={top.length + i + 1} row={r} highlight={false} onPress={() => navigateToStudent(r.studentId)} />
                ))}
              </View>
            </View>
          )}

          {unrated.length > 0 && (
            <View className="mb-3 px-4">
              <RankSectionLabel label={`${t('teacher.rankings.insufficientData', 'Not yet rated')} · ${unrated.length}`} />
              <View className="gap-1.5">
                {unrated.map(r => (
                  <UnratedRow
                    key={r.studentId}
                    name={r.studentName}
                    label={t('teacher.rankings.ratedSessions', { count: r.ratedSessionsCount })}
                    onPress={() => navigateToStudent(r.studentId)}
                  />
                ))}
              </View>
            </View>
          )}

          {isEmpty && (
            <View className="flex-1 items-center justify-center">
              <EmptyState
                scope="generic"
                title={t('teacher.rankings.noRatings', 'No ratings yet')}
                body={t('teacher.rankings.emptyHint', 'Rate students after a session to build the leaderboard.')}
              />
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
