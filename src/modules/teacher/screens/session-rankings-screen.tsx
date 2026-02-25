/**
 * SessionRankingsScreen
 * Displays ranked students for a session template with window filter.
 * Validates: Requirements 20.2–20.10
 */

import type { WindowFilter } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { FilterChips } from '../components';
import { useSessionRankings } from '../hooks';

const WINDOW_OPTIONS: { key: WindowFilter; labelKey: string }[] = [
    { key: 'last_5', labelKey: 'teacher.rankings.filterLast5' },
    { key: 'last_10', labelKey: 'teacher.rankings.filterLast10' },
    { key: 'all', labelKey: 'teacher.rankings.filterAll' },
];

const TREND_ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
    up: { name: 'trending-up', color: '#10B981' },
    down: { name: 'trending-down', color: '#EF4444' },
    stable: { name: 'remove', color: '#9CA3AF' },
};

export function SessionRankingsScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useLocalSearchParams<{ templateId?: string; id?: string }>();
    const templateId = (params.templateId || params.id) as string;
    const [window, setWindow] = useState<WindowFilter>('all');

    const { data, isLoading, isError, refetch } = useSessionRankings(templateId, window);

    const filterOptions = WINDOW_OPTIONS.map(o => ({ key: o.key, label: t(o.labelKey) }));

    const renderRankedItem = ({ item }: { item: NonNullable<typeof data>['rankings'][number] }) => {
        const trendConfig = item.trend ? TREND_ICONS[item.trend] : null;
        return (
            <View style={styles.rankRow}>
                <Text style={styles.rankNumber}>{item.rank}</Text>
                <View style={styles.rankInfo}>
                    <Text style={styles.studentName}>{item.studentName}</Text>
                    <Text style={styles.ratedSessions}>
                        {t('teacher.rankings.ratedSessions', { count: item.ratedSessionsCount })}
                    </Text>
                </View>
                <View style={styles.rankRight}>
                    <Text style={styles.averageRating}>{item.averageRating.toFixed(1)}/10</Text>
                    {trendConfig && (
                        <Ionicons name={trendConfig.name} size={16} color={trendConfig.color} />
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView edges={['top']} style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button">
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </Pressable>
                <Text style={styles.title}>{t('teacher.rankings.topStudents')}</Text>
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
                    <Text style={styles.errorText}>{t('teacher.common.genericError')}</Text>
                    <Pressable onPress={() => refetch()} style={styles.retryButton} accessibilityRole="button">
                        <Text style={styles.retryText}>{t('teacher.common.retry')}</Text>
                    </Pressable>
                </View>
            )}

            {!isLoading && !isError && data && data.rankings.length > 0 && (
                <FlatList
                    data={data.rankings}
                    keyExtractor={item => item.studentId}
                    renderItem={renderRankedItem}
                    ListFooterComponent={
                        data.insufficientData.length > 0
                            ? (
                                <View>
                                    <View style={styles.insufficientHeader}>
                                        <Text style={styles.insufficientTitle}>{t('teacher.rankings.insufficientData')}</Text>
                                        <Text style={styles.insufficientDesc}>{t('teacher.rankings.insufficientDataDescription')}</Text>
                                    </View>
                                    {data.insufficientData.map(item => (
                                        <View key={item.studentId} style={styles.rankRow}>
                                            <Text style={styles.rankNumber}>—</Text>
                                            <View style={styles.rankInfo}>
                                                <Text style={styles.studentName}>{item.studentName}</Text>
                                                <Text style={styles.ratedSessions}>
                                                    {t('teacher.rankings.ratedSessions', { count: item.ratedSessionsCount })}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )
                            : null
                    }
                    contentContainerStyle={styles.listContent}
                />
            )}

            {!isLoading && !isError && data && data.rankings.length === 0 && (
                <ScrollView contentContainerStyle={styles.listContent}>
                    {data.insufficientData.length > 0 ? (
                        <View>
                            <View style={styles.insufficientHeader}>
                                <Text style={styles.insufficientTitle}>{t('teacher.rankings.insufficientData')}</Text>
                                <Text style={styles.insufficientDesc}>{t('teacher.rankings.insufficientDataDescription')}</Text>
                            </View>
                            {data.insufficientData.map(item => (
                                <View key={item.studentId} style={styles.rankRow}>
                                    <Text style={styles.rankNumber}>—</Text>
                                    <View style={styles.rankInfo}>
                                        <Text style={styles.studentName}>{item.studentName}</Text>
                                        <Text style={styles.ratedSessions}>
                                            {t('teacher.rankings.ratedSessions', { count: item.ratedSessionsCount })}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{t('teacher.rankings.noRatings')}</Text>
                        </View>
                    )}
                </ScrollView>
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
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#3B82F6',
        borderRadius: 8,
    },
    retryText: { color: '#FFFFFF', fontWeight: '600' },
    emptyText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
    emptyContainer: { alignItems: 'center', paddingVertical: 40 },
    listContent: { padding: 16, gap: 8 },
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        gap: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    rankNumber: { fontSize: 18, fontWeight: '700', color: '#3B82F6', width: 28, textAlign: 'center' },
    rankInfo: { flex: 1 },
    studentName: { fontSize: 15, fontWeight: '600', color: '#111827' },
    ratedSessions: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    rankRight: { alignItems: 'flex-end', gap: 4 },
    averageRating: { fontSize: 15, fontWeight: '700', color: '#111827' },
    insufficientHeader: { paddingVertical: 12, paddingHorizontal: 4 },
    insufficientTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
    insufficientDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
