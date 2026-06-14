/**
 * SessionRankingsScreen — Phase-9 restyled leaderboard.
 * Three buckets: Top performers (≥7), Mid pack (0–6), Not yet rated.
 * Sort tabs: rating / delta / name.
 * Window filter row (last_5 / last_10 / all) kept above sort tabs.
 */

import type { RankedStudent, WindowFilter } from '../types';
import type { TrendIndicator } from '@/shared/performance';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, I18nManager, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { AppRoute } from '@/core/navigation/routes';
import { FilterChips } from '../components';
import { DeltaChip } from '../components/rankings/delta-chip';
import { RatingChip } from '../components/rankings/rating-chip';
import { useSessionRankings } from '../hooks';

const WINDOW_OPTIONS: { key: WindowFilter; labelKey: string }[] = [
  { key: 'last_5', labelKey: 'teacher.rankings.filterLast5' },
  { key: 'last_10', labelKey: 'teacher.rankings.filterLast10' },
  { key: 'all', labelKey: 'teacher.rankings.filterAll' },
];

type SortBy = 'rating' | 'delta' | 'name';
const TREND_ORDER: Record<NonNullable<TrendIndicator>, number> = { up: 3, stable: 2, down: 1 };

function sortRanked(rows: RankedStudent[], sortBy: SortBy): RankedStudent[] {
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

function SectionLabel({ label, accent }: { label: string; accent?: string }) {
  return (
    <View className="mb-2 flex-row items-center gap-2">
      {accent ? <View className="size-1.5 rounded-full" style={{ backgroundColor: accent }} /> : null}
      <Text className="text-caption font-bold tracking-widest text-ink-muted uppercase">{label}</Text>
    </View>
  );
}

function RankCircle({ idx, highlight }: { idx: number; highlight: boolean }) {
  return (
    <View
      className="size-6 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: highlight ? colors.brand.primary : colors.neutral.paper }}
    >
      <Text className="text-caption font-bold text-ink">{idx}</Text>
    </View>
  );
}

function Monogram({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return (
    <View className="size-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: colors.neutral.ink }}>
      <Text className="text-body font-bold" style={{ color: '#fff' }}>{initials}</Text>
    </View>
  );
}

function RankRow({ idx, row, highlight, onPress }: {
  idx: number;
  row: RankedStudent;
  highlight: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-2xl border p-3"
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? colors.neutral.paper : colors.neutral.card,
          borderColor: highlight ? colors.brand.primary : colors.neutral.rule,
          borderWidth: 1.5,
        },
      ]}
    >
      <RankCircle idx={idx} highlight={highlight} />
      <Monogram name={row.studentName} />
      <View className="min-w-0 flex-1">
        <View className="mb-1 flex-row items-center gap-1.5">
          <Text className="shrink text-[14px] font-bold text-ink" numberOfLines={1}>
            {row.studentName}
          </Text>
          <DeltaChip trend={row.trend} />
        </View>
        <RatingChip value={row.averageRating} />
      </View>
    </Pressable>
  );
}

function UnratedRow({ name, ratedCount: _ratedCount, label, onPress }: {
  name: string;
  ratedCount: number;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row items-center gap-3 rounded-2xl p-3"
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? colors.neutral.paper : colors.neutral.card,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: colors.neutral.rule,
        },
      ]}
    >
      <View className="w-6 items-center">
        <Text className="text-caption font-bold text-ink-muted">—</Text>
      </View>
      <Monogram name={name} />
      <View className="min-w-0 flex-1">
        <Text className="text-[14px] font-bold text-ink" numberOfLines={1}>{name}</Text>
        <Text className="mt-0.5 text-caption text-ink-muted">{label}</Text>
      </View>
    </Pressable>
  );
}

function HeroCard({ subject, ratedCount, totalCount, avg }: {
  subject: string;
  ratedCount: number;
  totalCount: number;
  avg: string;
}) {
  const { t } = useTranslation();
  return (
    <View
      className="mx-4 overflow-hidden rounded-2xl p-4"
      style={{ backgroundColor: colors.neutral.ink, position: 'relative' }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -40,
          [I18nManager.isRTL ? 'left' : 'right']: -40,
          width: 160,
          height: 160,
          borderRadius: 999,
          backgroundColor: colors.brand.primary,
          opacity: 0.25,
        }}
      />
      <Text
        className="mb-2.5 text-caption font-bold tracking-widest uppercase"
        style={{ color: colors.brand.primary }}
      >
        {subject}
      </Text>
      <View className="flex-row items-baseline gap-3">
        <View>
          <Text className="text-[42px] leading-none font-bold" style={{ color: '#fff' }}>{avg}</Text>
          <Text className="text-body font-semibold" style={{ color: colors.neutral.dim }}>{t('teacher.rankings.outOfAvg', '/10 avg')}</Text>
        </View>
        <View className="h-9 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
        <View>
          <Text className="text-headline font-bold" style={{ color: '#fff' }}>
            {ratedCount}
            <Text className="text-[14px]" style={{ color: colors.neutral.dim }}>
              /
              {totalCount}
            </Text>
          </Text>
          <Text className="text-caption font-bold tracking-wide uppercase" style={{ color: colors.neutral.dim }}>{t('teacher.rankings.ratedLabel', 'rated')}</Text>
        </View>
      </View>
    </View>
  );
}

function SortTabs({ active, onChange }: { active: SortBy; onChange: (s: SortBy) => void }) {
  const { t } = useTranslation();
  const tabs: { key: SortBy; label: string }[] = [
    { key: 'rating', label: t('teacher.rankings.averageRating', 'Rating') },
    { key: 'delta', label: t('teacher.rankings.trend', 'Trend') },
    { key: 'name', label: t('teacher.students.title', 'Name') },
  ];
  return (
    <View className="mx-4 mb-3 flex-row rounded-xl p-0.5" style={{ backgroundColor: colors.neutral.paper }}>
      {tabs.map(tab => (
        <Pressable
          key={tab.key}
          onPress={() => onChange(tab.key)}
          className="flex-1 items-center rounded-xl py-2"
          style={active === tab.key ? { backgroundColor: colors.neutral.card } : undefined}
        >
          <Text
            className="text-body font-semibold"
            style={{ color: active === tab.key ? colors.neutral.ink : colors.neutral.inkMuted }}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// eslint-disable-next-line max-lines-per-function
export function SessionRankingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ templateId?: string; id?: string }>();
  const templateId = (params.templateId ?? params.id) as string;
  const [windowFilter, setWindowFilter] = useState<WindowFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('rating');

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

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      {/* Header */}
      <View className="flex-row items-center border-b border-rule px-4 py-3" style={{ backgroundColor: colors.neutral.card }}>
        <Pressable onPress={() => router.back()} className="me-2 p-1" accessibilityRole="button">
          <Ionicons
            name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'}
            size={24}
            color={colors.neutral.ink}
          />
        </Pressable>
        <Text className="flex-1 text-title font-bold text-ink">
          {t('teacher.rankings.topStudents', 'Rankings')}
        </Text>
      </View>

      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      )}

      {isError && (
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text className="text-center text-body-lg text-ink-muted">
            {t('teacher.common.genericError', 'Something went wrong')}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="rounded-xl px-5 py-2.5"
            style={{ backgroundColor: colors.semantic.infoSoft }}
            accessibilityRole="button"
          >
            <Text className="text-[14px] font-semibold" style={{ color: colors.semantic.info }}>
              {t('teacher.common.retry', 'Retry')}
            </Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !isError && (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Hero */}
          {data && (
            <View className="pt-4 pb-3">
              <HeroCard
                subject={data.summary.templateSubject}
                ratedCount={ranked.length}
                totalCount={totalStudents}
                avg={avg}
              />
            </View>
          )}

          {/* Window filter */}
          <FilterChips
            options={filterOptions}
            selected={windowFilter}
            onSelect={v => setWindowFilter(v as WindowFilter)}
          />

          {/* Sort tabs */}
          <SortTabs active={sortBy} onChange={setSortBy} />

          {/* Top performers */}
          {top.length > 0 && (
            <View className="mb-3 px-4">
              <SectionLabel label={`${t('teacher.rankings.topStudents', 'Top performers')} · ${top.length}`} accent={colors.brand.primary} />
              <View className="gap-1.5">
                {top.map((r, i) => (
                  <RankRow key={r.studentId} idx={i + 1} row={r} highlight onPress={() => navigateToStudent(r.studentId)} />
                ))}
              </View>
            </View>
          )}

          {/* Mid pack */}
          {mid.length > 0 && (
            <View className="mb-3 px-4">
              <SectionLabel label={`${t('teacher.rankings.midPack', 'Mid pack')} · ${mid.length}`} />
              <View className="gap-1.5">
                {mid.map((r, i) => (
                  <RankRow key={r.studentId} idx={top.length + i + 1} row={r} highlight={false} onPress={() => navigateToStudent(r.studentId)} />
                ))}
              </View>
            </View>
          )}

          {/* Not yet rated */}
          {unrated.length > 0 && (
            <View className="mb-3 px-4">
              <SectionLabel label={`${t('teacher.rankings.insufficientData', 'Not yet rated')} · ${unrated.length}`} />
              <View className="gap-1.5">
                {unrated.map(r => (
                  <UnratedRow
                    key={r.studentId}
                    name={r.studentName}
                    ratedCount={r.ratedSessionsCount}
                    label={t('teacher.rankings.ratedSessions', { count: r.ratedSessionsCount })}
                    onPress={() => navigateToStudent(r.studentId)}
                  />
                ))}
              </View>
            </View>
          )}

          {ranked.length === 0 && unrated.length === 0 && (
            <View className="items-center py-10">
              <Text className="text-center text-body-lg text-ink-muted">
                {t('teacher.rankings.noRatings', 'No ratings yet')}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
