/**
 * TeacherStudentPerformanceScreen
 * Shows performance history for a student across all teacher's sessions.
 * Validates: Requirements 23.2–23.10
 */

import type { PerformanceResponse, WindowFilter } from '@/shared/performance';
import { AxiosError } from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, ErrorState, Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { useStudentPerformance } from '@/shared/performance';
import { FilterChips } from '../components';
import { BackHeader } from '../components/back-header';
import { RecordRow, SummaryTile } from '../components/performance/performance-rows';
import { PerformanceListSkeleton } from '../components/performance/performance-skeleton';

const WINDOW_OPTIONS: { key: WindowFilter; labelKey: string }[] = [
  { key: 'last_5', labelKey: 'teacher.rankings.filterLast5' },
  { key: 'last_10', labelKey: 'teacher.rankings.filterLast10' },
  { key: 'all', labelKey: 'teacher.rankings.filterAll' },
];

function SummaryRow({ summary }: { summary: PerformanceResponse['summary'] }) {
  const { t } = useTranslation();
  return (
    <View className="mb-4 flex-row flex-wrap gap-2">
      <SummaryTile
        label={t('teacher.performance.average', 'Average')}
        value={summary.averageRating !== null ? `${summary.averageRating.toFixed(1)}/10` : '—'}
      />
      <SummaryTile
        label={t('teacher.performance.highest', 'Highest')}
        value={summary.highestRating !== null ? `${summary.highestRating}/10` : '—'}
      />
      <SummaryTile
        label={t('teacher.performance.lowest', 'Lowest')}
        value={summary.lowestRating !== null ? `${summary.lowestRating}/10` : '—'}
      />
      <SummaryTile
        label={t('teacher.performance.ratedCount', 'Rated')}
        value={`${summary.ratedSessionsCount}/${summary.totalSessionsCount}`}
      />
    </View>
  );
}

export function TeacherStudentPerformanceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId?: string; id?: string }>();
  const studentId = params.studentId || params.id;
  const [window, setWindow] = useState<WindowFilter>('all');

  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useStudentPerformance(studentId ?? '', window, 'teacher');

  const filterOptions = WINDOW_OPTIONS.map(o => ({ key: o.key, label: t(o.labelKey) }));
  const allPages = data?.pages ?? [];
  const firstPage = allPages[0] as PerformanceResponse | undefined;
  const summary = firstPage?.summary;
  const allRecords = allPages.flatMap(p => (p as PerformanceResponse).records);
  const isFeatureDisabled = error instanceof AxiosError && error.response?.status === 403;

  if (!studentId) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
        <BackHeader
          title={t('teacher.performance.studentPerformance')}
          onBack={() => router.back()}
          backLabel={t('teacher.common.back')}
        />
        <View className="flex-1 items-center justify-center">
          <ErrorState
            title={t('teacher.common.errorTitle', 'Something went wrong')}
            body={t('teacher.common.genericError')}
            action={{ label: t('teacher.common.back'), onPress: () => router.back() }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      <BackHeader
        title={t('teacher.performance.studentPerformance')}
        onBack={() => router.back()}
        backLabel={t('teacher.common.back')}
      />

      <FilterChips
        options={filterOptions}
        selected={window}
        onSelect={v => setWindow(v as WindowFilter)}
      />

      {isLoading && <PerformanceListSkeleton />}

      {isError && (
        <View className="flex-1 items-center justify-center">
          <ErrorState
            title={isFeatureDisabled
              ? t('teacher.common.featureDisabledTitle', 'Feature unavailable')
              : t('teacher.common.errorTitle', 'Something went wrong')}
            body={isFeatureDisabled
              ? t('teacher.common.featureDisabled')
              : t('teacher.common.genericError')}
            action={isFeatureDisabled
              ? { label: t('teacher.common.back'), onPress: () => router.back() }
              : { label: t('teacher.common.retry'), onPress: () => refetch() }}
          />
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={allRecords}
          keyExtractor={(item, index) => `${item.sessionInstanceId}-${index}`}
          renderItem={({ item }) => <RecordRow record={item} />}
          ListHeaderComponent={summary ? <SummaryRow summary={summary} /> : null}
          ListEmptyComponent={(
            <EmptyState
              scope="generic"
              title={t('teacher.performance.emptyState')}
              body={t('teacher.performance.emptyStateHint')}
            />
          )}
          ListFooterComponent={hasNextPage
            ? (
                <Pressable
                  className="items-center py-4"
                  onPress={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  accessibilityRole="button"
                >
                  <Text className="text-body font-semibold" style={{ color: colors.semantic.info }}>
                    {isFetchingNextPage
                      ? t('teacher.common.loading')
                      : t('teacher.performance.loadMore', 'Load more')}
                  </Text>
                </Pressable>
              )
            : null}
          contentContainerStyle={[
            { padding: 16, gap: 8 },
            allRecords.length === 0 && { flexGrow: 1 },
          ]}
        />
      )}
    </SafeAreaView>
  );
}
