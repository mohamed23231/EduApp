/**
 * Rankings header pieces — ink hero card, sort tabs, section label.
 * Extracted from session-rankings-screen.
 */

import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

export type RankSortBy = 'rating' | 'delta' | 'name';

export function RankSectionLabel({ label, accent }: { label: string; accent?: string }) {
  return (
    <View className="mb-2 flex-row items-center gap-2">
      {accent ? <View className="size-1.5 rounded-full" style={{ backgroundColor: accent }} /> : null}
      <Text className="text-caption font-bold tracking-widest text-ink-muted uppercase">{label}</Text>
    </View>
  );
}

type HeroCardProps = {
  subject: string;
  ratedCount: number;
  totalCount: number;
  avg: string;
};

export function RankingsHero({ subject, ratedCount, totalCount, avg }: HeroCardProps) {
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
          end: -40,
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
          <Text className="text-[42px] leading-none font-bold" style={{ color: colors.neutral.white }}>{avg}</Text>
          <Text className="text-body font-semibold" style={{ color: colors.neutral.dim }}>{t('teacher.rankings.outOfAvg', '/10 avg')}</Text>
        </View>
        {/* TODO(token): rgba(255,255,255,0.15) */}
        <View className="h-9 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
        <View>
          <Text className="text-headline font-bold" style={{ color: colors.neutral.white }}>
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

export function RankSortTabs({ active, onChange }: { active: RankSortBy; onChange: (s: RankSortBy) => void }) {
  const { t } = useTranslation();
  const tabs: { key: RankSortBy; label: string }[] = [
    { key: 'rating', label: t('teacher.rankings.averageRating', 'Rating') },
    { key: 'delta', label: t('teacher.rankings.trendTab', 'Trend') },
    { key: 'name', label: t('teacher.rankings.nameTab', 'Name') },
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
