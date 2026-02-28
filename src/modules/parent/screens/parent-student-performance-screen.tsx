/**
 * ParentStudentPerformanceScreen
 * Shows performance history for a student from the parent's perspective.
 * Uses supportive, non-punitive wording. Low-score highlights use amber accent.
 * Validates: Requirements 26.2–26.11
 */

import type { ParentPerformanceResponse, PerformanceRecord, WindowFilter } from '@/modules/teacher/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, I18nManager, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { useStudentPerformance } from '@/modules/teacher/hooks';

const WINDOW_OPTIONS: { key: WindowFilter; labelKey: string }[] = [
  { key: 'last_5', labelKey: 'teacher.rankings.filterLast5' },
  { key: 'last_10', labelKey: 'teacher.rankings.filterLast10' },
  { key: 'all', labelKey: 'teacher.rankings.filterAll' },
];

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function RecordRow({ record, t }: { record: PerformanceRecord; t: (k: string, o?: any) => string }) {
  return (
    <View style={styles.recordRow}>
      <View style={styles.recordLeft}>
        <Text style={styles.recordDate}>{record.date}</Text>
        <Text style={styles.recordSubject}>{record.sessionSubject}</Text>
      </View>
      <View style={styles.recordRight}>
        <View style={[styles.statusBadge, styles[`status_${record.status}`]]}>
          <Text style={styles.statusText}>{record.status}</Text>
        </View>
        <Text style={styles.ratingText}>
          {record.rating !== null ? `${record.rating}/10` : t('parent.performance.noRating')}
        </Text>
      </View>
    </View>
  );
}

export function ParentStudentPerformanceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId?: string; id?: string }>();
  const studentId = (params.studentId || params.id) as string;
  const [window, setWindow] = useState<WindowFilter>('all');

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useStudentPerformance(studentId, window, 'parent');

  const allPages = data?.pages ?? [];
  const firstPage = allPages[0] as ParentPerformanceResponse | undefined;
  const summary = firstPage?.summary;
  const lowScoreHighlights = firstPage?.lowScoreHighlights ?? [];
  const allRecords = allPages.flatMap(p => (p as ParentPerformanceResponse).records);

  const filterOptions = WINDOW_OPTIONS.map(o => ({ id: o.key, label: t(o.labelKey) }));

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.title}>{t('parent.performance.title')}</Text>
      </View>

      {/* Filter bar */}
      <View style={styles.filterRow}>
        {filterOptions.map(opt => (
          <Pressable
            key={opt.id}
            style={[styles.filterChip, window === opt.id && styles.filterChipActive]}
            onPress={() => setWindow(opt.id as WindowFilter)}
            accessibilityRole="button"
          >
            <Text style={[styles.filterChipText, window === opt.id && styles.filterChipTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      )}

      {isError && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t('parent.common.genericError')}</Text>
          <Pressable onPress={() => refetch()} style={styles.retryButton} accessibilityRole="button">
            <Text style={styles.retryText}>{t('parent.common.retry')}</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={allRecords}
          keyExtractor={item => item.sessionInstanceId}
          renderItem={({ item }) => <RecordRow record={item} t={t} />}
          ListHeaderComponent={(
            <>
              {summary && (
                <View style={styles.summaryRow}>
                  <SummaryCard
                    label={t('parent.performance.average')}
                    value={summary.averageRating !== null ? `${summary.averageRating.toFixed(1)}/10` : '—'}
                  />
                  <SummaryCard
                    label={t('parent.performance.highest')}
                    value={summary.highestRating !== null ? `${summary.highestRating}/10` : '—'}
                  />
                  <SummaryCard
                    label={t('parent.performance.lowest')}
                    value={summary.lowestRating !== null ? `${summary.lowestRating}/10` : '—'}
                  />
                  <SummaryCard
                    label={t('parent.performance.ratedCount')}
                    value={`${summary.ratedSessionsCount}/${summary.totalSessionsCount}`}
                  />
                </View>
              )}
              {lowScoreHighlights.length > 0 && (
                <View style={styles.highlightsSection}>
                  <Text style={styles.highlightsTitle}>{t('parent.performance.lowScoreNote')}</Text>
                  {lowScoreHighlights.map(h => (
                    <View key={h.sessionInstanceId} style={styles.highlightRow}>
                      <Ionicons name="alert-circle-outline" size={16} color="#D97706" />
                      <Text style={styles.highlightText}>
                        {h.date}
                        {' '}
                        —
                        {h.sessionSubject}
                        :
                        {h.rating}
                        /10
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
          ListEmptyComponent={(
            <View style={styles.centered}>
              <Text style={styles.emptyText}>{t('parent.performance.emptyState')}</Text>
              <Text style={styles.emptyHint}>{t('parent.performance.emptyStateHint')}</Text>
            </View>
          )}
          ListFooterComponent={
            hasNextPage
              ? (
                  <Pressable
                    style={styles.loadMoreButton}
                    onPress={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    accessibilityRole="button"
                  >
                    {isFetchingNextPage
                      ? <ActivityIndicator size="small" />
                      : <Text style={styles.loadMoreText}>{t('parent.common.loading')}</Text>}
                  </Pressable>
                )
              : null
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1 },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  filterChipText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  filterChipTextActive: { color: '#FFFFFF' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 12 },
  retryButton: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#3B82F6', borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontWeight: '600' },
  emptyText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
  emptyHint: { fontSize: 13, color: '#D1D5DB', textAlign: 'center', marginTop: 4 },
  listContent: { padding: 16, gap: 8 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  summaryCard: {
    flex: 1,
    minWidth: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  summaryValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  summaryLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2, textAlign: 'center' },
  highlightsSection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 8,
  },
  highlightsTitle: { fontSize: 13, fontWeight: '600', color: '#92400E' },
  highlightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  highlightText: { fontSize: 13, color: '#78350F', flex: 1 },
  recordRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 12,
  },
  recordLeft: { flex: 1 },
  recordDate: { fontSize: 13, fontWeight: '600', color: '#374151' },
  recordSubject: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  recordRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  status_PRESENT: { backgroundColor: '#D1FAE5' },
  status_ABSENT: { backgroundColor: '#FEE2E2' },
  status_EXCUSED: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#111827' },
  loadMoreButton: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { color: '#3B82F6', fontWeight: '600' },
} as any);
