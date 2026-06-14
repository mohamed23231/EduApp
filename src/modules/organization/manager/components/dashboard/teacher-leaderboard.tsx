/**
 * TeacherLeaderboard — top 3 teachers this week ranked by attendance rate.
 */

import type { OrgTeacherStatsItem } from '../../types/manager.types';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { Monogram, useMonogramTone } from '@/components/ui/monogram';

type Props = {
  teachers: OrgTeacherStatsItem[];
  onViewAll: () => void;
};

function RankBadge({ rank }: { rank: number }) {
  const isFirst = rank === 1;
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: isFirst ? colors.brand.primary : colors.neutral.paper,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: isFirst ? colors.neutral.ink : colors.neutral.inkMuted,
        }}
      >
        {rank}
      </Text>
    </View>
  );
}

function TeacherRow({ item, rank }: { item: OrgTeacherStatsItem; rank: number }) {
  const tone = useMonogramTone(item.memberId);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
      }}
    >
      <RankBadge rank={rank} />
      <Monogram name={item.name} tone={tone} size={44} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.neutral.ink }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ fontSize: 12, color: colors.neutral.inkMuted, fontWeight: '500' }} numberOfLines={1}>
          {`${item.assignedSessions} sessions`}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 15,
          fontWeight: '800',
          color: rank === 1 ? colors.brand.primary : colors.neutral.ink,
        }}
      >
        {`${Math.round(item.averageAttendanceRate)}%`}
      </Text>
    </View>
  );
}

export function TeacherLeaderboard({ teachers, onViewAll }: Props) {
  const { t } = useTranslation();
  const top3 = teachers.slice(0, 3);

  if (top3.length === 0)
    return null;

  return (
    <View className="mt-5 px-4">
      {/* Section header */}
      <View className="mb-1 flex-row items-center">
        <Text
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: '700',
            color: colors.neutral.inkMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}
        >
          {t('manager.dashboard.leaderboard.title', { defaultValue: 'Top teachers · this week' })}
        </Text>
        <Pressable onPress={onViewAll} accessibilityRole="button">
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.brand.primary }}>
            {t('manager.dashboard.leaderboard.all', { defaultValue: 'All' })}
          </Text>
        </Pressable>
      </View>

      {/* Rows */}
      <View
        className="rounded-2xl border px-4"
        style={{ backgroundColor: colors.neutral.card, borderColor: colors.neutral.rule }}
      >
        {top3.map((item, idx) => (
          <View key={item.memberId}>
            <TeacherRow item={item} rank={idx + 1} />
            {idx < top3.length - 1 && (
              <View style={{ height: 1, backgroundColor: colors.neutral.rule }} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
