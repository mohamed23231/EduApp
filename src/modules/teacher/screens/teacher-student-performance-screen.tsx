/**
 * TeacherStudentPerformanceScreen
 * Shows performance history for a student across all teacher's sessions.
 * Validates: Requirements 23.2–23.10
 */

import type { PerformanceRecord, PerformanceResponse, WindowFilter } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AxiosError } from 'axios';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { FilterChips } from '../components';
import { useStudentPerformance } from '../hooks';

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
                {record.excuseNote && (
                    <Text style={styles.excuseNote}>{record.excuseNote}</Text>
                )}
            </View>
            <View style={styles.recordRight}>
                <View style={[styles.statusBadge, styles[`status_${record.status}`]]}>
                    <Text style={styles.statusText}>{record.status}</Text>
                </View>
                <Text style={styles.ratingText}>
                    {record.rating !== null ? `${record.rating}/10` : t('teacher.performance.noRatingLabel')}
                </Text>
            </View>
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

    // Check if error is FEATURE_DISABLED (403)
    const isFeatureDisabled = error instanceof AxiosError && error.response?.status === 403;

    // Guard: if no studentId, show error
    if (!studentId) {
        return (
            <SafeAreaView edges={['top']} style={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button">
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </Pressable>
                    <Text style={styles.title}>{t('teacher.performance.studentPerformance')}</Text>
                </View>
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{t('teacher.common.genericError')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button">
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </Pressable>
                <Text style={styles.title}>{t('teacher.performance.studentPerformance')}</Text>
            </View>

            <FilterChips
                options={filterOptions}
                selected={window}
                onSelect={v => setWindow(v as WindowFilter)}
            />

            {isLoading && (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                </View>
            )}

            {isError && (
                <View style={styles.centered}>
                    <Ionicons
                        name={isFeatureDisabled ? 'lock-closed-outline' : 'alert-circle-outline'}
                        size={48}
                        color="#9CA3AF"
                        style={{ marginBottom: 12 }}
                    />
                    <Text style={styles.errorText}>
                        {isFeatureDisabled
                            ? t('teacher.common.featureDisabled')
                            : t('teacher.common.genericError')}
                    </Text>
                    {!isFeatureDisabled && (
                        <Pressable onPress={() => refetch()} style={styles.retryButton} accessibilityRole="button">
                            <Text style={styles.retryText}>{t('teacher.common.retry')}</Text>
                        </Pressable>
                    )}
                    <Pressable onPress={() => router.back()} style={styles.backLink} accessibilityRole="button">
                        <Text style={styles.backLinkText}>{t('teacher.common.back')}</Text>
                    </Pressable>
                </View>
            )}

            {!isLoading && !isError && (
                <FlatList
                    data={allRecords}
                    keyExtractor={(item, index) => `${item.sessionInstanceId}-${index}`}
                    renderItem={({ item }) => <RecordRow record={item} t={t} />}
                    ListHeaderComponent={
                        summary
                            ? (
                                <View style={styles.summaryRow}>
                                    <SummaryCard
                                        label={t('teacher.performance.average')}
                                        value={summary.averageRating !== null ? `${summary.averageRating.toFixed(1)}/10` : '—'}
                                    />
                                    <SummaryCard
                                        label={t('teacher.performance.highest')}
                                        value={summary.highestRating !== null ? `${summary.highestRating}/10` : '—'}
                                    />
                                    <SummaryCard
                                        label={t('teacher.performance.lowest')}
                                        value={summary.lowestRating !== null ? `${summary.lowestRating}/10` : '—'}
                                    />
                                    <SummaryCard
                                        label={t('teacher.performance.ratedCount')}
                                        value={`${summary.ratedSessionsCount}/${summary.totalSessionsCount}`}
                                    />
                                </View>
                            )
                            : null
                    }
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Text style={styles.emptyText}>{t('teacher.performance.emptyState')}</Text>
                            <Text style={styles.emptyHint}>{t('teacher.performance.emptyStateHint')}</Text>
                        </View>
                    }
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
                                        : <Text style={styles.loadMoreText}>{t('teacher.common.loading')}</Text>}
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
        flexDirection: 'row',
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
    filterChips: { paddingHorizontal: 16, paddingVertical: 12 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    errorText: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 12 },
    retryButton: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#3B82F6', borderRadius: 8, marginBottom: 12 },
    retryText: { color: '#FFFFFF', fontWeight: '600' },
    backLink: { paddingVertical: 8 },
    backLinkText: { color: '#3B82F6', fontWeight: '500', fontSize: 14 },
    emptyText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
    emptyHint: { fontSize: 13, color: '#D1D5DB', textAlign: 'center', marginTop: 4 },
    listContent: { padding: 16, gap: 8 },
    summaryRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
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
    excuseNote: { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontStyle: 'italic' },
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
