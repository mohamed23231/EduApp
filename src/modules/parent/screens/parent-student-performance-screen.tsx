/**
 * ParentStudentPerformanceScreen
 * Shows performance history for a student from the parent's perspective.
 * Uses supportive, non-punitive wording. Low-score highlights use amber accent.
 * Validates: Requirements 26.2-26.11
 */

import type { ParentPerformanceResponse, PerformanceRecord, WindowFilter } from '@/modules/teacher/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, I18nManager, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { useStudentPerformance } from '@/modules/teacher/hooks';

const WINDOW_OPTIONS: { key: WindowFilter; labelKey: string }[] = [
  { key: 'last_5', labelKey: 'teacher.rankings.filterLast5' },
  { key: 'last_10', labelKey: 'teacher.rankings.filterLast10' },
  { key: 'all', labelKey: 'teacher.rankings.filterAll' },
];

function getStatusStyle(status: string): { bg: string; text: string } {
  switch (status) {
    case 'PRESENT':
      return { bg: '#D1FAE5', text: '#065F46' };
    case 'ABSENT':
      return { bg: '#FEE2E2', text: '#991B1B' };
    case 'EXCUSED':
      return { bg: '#FEF3C7', text: '#92400E' };
    default:
      return { bg: '#F3F4F6', text: '#374151' };
  }
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[70px] flex-1 items-center rounded-xl border border-gray-200 bg-white p-3">
      <Text className="text-base font-bold text-gray-900">{value}</Text>
      <Text className="mt-1 text-center text-[11px] text-gray-400">{label}</Text>
    </View>
  );
}

type TFunc = ReturnType<typeof useTranslation>['t'];

function RecordRow({ record, t }: { record: PerformanceRecord; t: TFunc }) {
  const statusStyle = getStatusStyle(record.status);
  const isRTL = I18nManager.isRTL;

  return (
    <View className="rounded-xl border border-gray-200 bg-white p-3.5" style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 12 }}>
      <View className="flex-1">
        <Text className="text-[13px] font-semibold text-gray-700">{record.date}</Text>
        <Text className="mt-0.5 text-xs text-gray-500">{record.sessionSubject}</Text>
      </View>
      <View className="items-end gap-1.5">
        <View
          className="rounded-full px-2 py-0.5"
          style={{ backgroundColor: statusStyle.bg }}
        >
          <Text className="text-[11px] font-semibold" style={{ color: statusStyle.text }}>
            {record.status}
          </Text>
        </View>
        <Text className="text-sm font-bold text-gray-900">
          {record.rating !== null ? `${record.rating}/10` : t('parent.performance.noRating')}
        </Text>
      </View>
    </View>
  );
}

function PerformanceLoadingView() {
  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );
}

function PerformanceErrorView({ onRetry, t }: { onRetry: () => void; t: TFunc }) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <View className="mb-4 size-16 items-center justify-center rounded-full bg-red-100">
        <Ionicons name="alert" size={32} color="#EF4444" />
      </View>
      <Text className="mb-2 text-center text-lg font-bold text-gray-900">
        {t('parent.common.errorTitle', 'Oops!')}
      </Text>
      <Text className="mb-6 text-center text-sm font-medium text-gray-500">
        {t('parent.common.genericError')}
      </Text>
      <Pressable
        className="rounded-lg bg-blue-500 px-5 py-2.5"
        onPress={onRetry}
        accessibilityRole="button"
      >
        <Text className="font-semibold text-white">
          {t('parent.common.retry')}
        </Text>
      </Pressable>
    </View>
  );
}

type LowScoreHighlight = {
  sessionInstanceId: string;
  date: string;
  rating: number;
  sessionSubject: string;
};

type PerformanceSummary = {
  averageRating: number | null;
  highestRating: number | null;
  lowestRating: number | null;
  ratedSessionsCount: number;
  totalSessionsCount: number;
};

type ListHeaderProps = {
  summary: PerformanceSummary | undefined;
  lowScoreHighlights: LowScoreHighlight[];
  t: TFunc;
};

function PerformanceListHeader({ summary, lowScoreHighlights, t }: ListHeaderProps) {
  return (
    <>
      {summary && (
        <View className="mb-4 flex-row flex-wrap gap-2">
          <SummaryCard
            label={t('parent.performance.average')}
            value={summary.averageRating !== null ? `${summary.averageRating.toFixed(1)}/10` : '\u2014'}
          />
          <SummaryCard
            label={t('parent.performance.highest')}
            value={summary.highestRating !== null ? `${summary.highestRating}/10` : '\u2014'}
          />
          <SummaryCard
            label={t('parent.performance.lowest')}
            value={summary.lowestRating !== null ? `${summary.lowestRating}/10` : '\u2014'}
          />
          <SummaryCard
            label={t('parent.performance.ratedCount')}
            value={`${summary.ratedSessionsCount}/${summary.totalSessionsCount}`}
          />
        </View>
      )}
      {lowScoreHighlights.length > 0 && (
        <View className="mb-4 gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
          <Text className="text-[13px] font-semibold text-amber-900">
            {t('parent.performance.lowScoreNote')}
          </Text>
          {lowScoreHighlights.map(h => (
            <View key={h.sessionInstanceId} className="flex-row items-center gap-2">
              <Ionicons name="alert-circle-outline" size={16} color="#D97706" />
              <Text className="flex-1 text-[13px] text-amber-800">
                {h.date}
                {' \u2014 '}
                {h.sessionSubject}
                {': '}
                {h.rating}
                /10
              </Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}

function PerformanceLoadMore({ onPress, isLoading, t }: { onPress: () => void; isLoading: boolean; t: TFunc }) {
  return (
    <Pressable
      className="items-center py-4"
      onPress={onPress}
      disabled={isLoading}
      accessibilityRole="button"
    >
      {isLoading
        ? <ActivityIndicator size="small" color="#3B82F6" />
        : <Text className="font-semibold text-blue-500">{t('parent.common.loading')}</Text>}
    </Pressable>
  );
}

function PerformanceEmptyView({ t }: { t: TFunc }) {
  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <View className="mb-6 size-20 items-center justify-center rounded-full bg-gray-100">
        <Ionicons name="analytics-outline" size={40} color="#9CA3AF" />
      </View>
      <Text className="mb-2 text-center text-xl font-bold text-gray-900">
        {t('parent.performance.emptyState')}
      </Text>
      <Text className="text-center text-base text-gray-500">
        {t('parent.performance.emptyStateHint')}
      </Text>
    </View>
  );
}

export function ParentStudentPerformanceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId?: string; id?: string }>();
  const studentId = (params.studentId || params.id) as string;
  const [window, setWindow] = useState<WindowFilter>('all');
  const isRTL = I18nManager.isRTL;

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useStudentPerformance(studentId, window, 'parent');

  const allPages = data?.pages ?? [];
  const firstPage = allPages[0] as ParentPerformanceResponse | undefined;
  const summary = firstPage?.summary;
  const lowScoreHighlights = firstPage?.lowScoreHighlights ?? [];
  const allRecords = allPages.flatMap(p => (p as ParentPerformanceResponse).records);

  const filterOptions = WINDOW_OPTIONS.map(o => ({ id: o.key, label: t(o.labelKey) }));

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-white">
      {/* Header */}
      <View
        className="items-center border-b border-gray-100 bg-white px-4 py-3"
        style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
      >
        <Pressable
          className="size-10 items-center justify-center rounded-full border border-gray-200"
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color="#111827" />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-bold text-gray-900">
          {t('parent.performance.title')}
        </Text>
        <View className="size-10" />
      </View>

      {/* Filter row */}
      <View className="flex-row gap-2 border-b border-gray-100 bg-white px-4 py-3">
        {filterOptions.map(opt => (
          <Pressable
            key={opt.id}
            className={
              window === opt.id
                ? 'rounded-full bg-blue-500 px-4 py-2'
                : 'rounded-full border border-gray-300 bg-white px-4 py-2'
            }
            onPress={() => setWindow(opt.id as WindowFilter)}
            accessibilityRole="button"
          >
            <Text
              className={
                window === opt.id
                  ? 'text-[13px] font-semibold text-white'
                  : 'text-[13px] font-medium text-gray-500'
              }
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading && <PerformanceLoadingView />}

      {isError && <PerformanceErrorView onRetry={() => refetch()} t={t} />}

      {!isLoading && !isError && (
        <FlatList
          data={allRecords}
          keyExtractor={item => item.sessionInstanceId}
          renderItem={({ item }) => <RecordRow record={item} t={t} />}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListHeaderComponent={(
            <PerformanceListHeader
              summary={summary}
              lowScoreHighlights={lowScoreHighlights}
              t={t}
            />
          )}
          ListEmptyComponent={<PerformanceEmptyView t={t} />}
          ListFooterComponent={
            hasNextPage
              ? <PerformanceLoadMore onPress={() => fetchNextPage()} isLoading={isFetchingNextPage} t={t} />
              : null
          }
        />
      )}
    </SafeAreaView>
  );
}
