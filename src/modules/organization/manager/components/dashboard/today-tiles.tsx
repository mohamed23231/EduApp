/**
 * TodayTiles — 2-column grid: Sessions today (lime) + At-risk (white card).
 */

import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type Props = {
  todaySessions: number;
  runningNow: number;
  upcomingCount: number;
  atRiskCount: number;
};

export function TodayTiles({ todaySessions, runningNow, upcomingCount, atRiskCount }: Props) {
  const { t } = useTranslation();

  return (
    <View className="mt-3 flex-row gap-3 px-4">
      {/* Sessions today — lime bg */}
      <View
        className="flex-1 rounded-[20px] p-4"
        style={{ backgroundColor: colors.brand.primary }}
      >
        <Text
          style={{
            color: colors.neutral.ink,
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          {t('manager.dashboard.tiles.sessionsLabel', { defaultValue: 'Sessions today' })}
        </Text>
        <Text
          style={{
            color: colors.neutral.ink,
            fontSize: 36,
            fontWeight: '800',
            letterSpacing: -1,
            lineHeight: 42,
          }}
        >
          {todaySessions}
        </Text>
        <Text style={{ color: colors.neutral.inkMuted, fontSize: 12, fontWeight: '500', marginTop: 2 }}>
          {t('manager.dashboard.tiles.sessionsSub', {
            defaultValue: '{{live}} live · {{upcoming}} upcoming',
            live: runningNow,
            upcoming: upcomingCount,
          })}
        </Text>
      </View>

      {/* At-risk — white card */}
      <View
        className="flex-1 rounded-[20px] border p-4"
        style={{ backgroundColor: colors.neutral.card, borderColor: colors.neutral.rule }}
      >
        <Text
          style={{
            color: colors.semantic.absent,
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          {t('manager.dashboard.tiles.atRiskLabel', { defaultValue: 'At-risk' })}
        </Text>
        <Text
          style={{
            color: colors.neutral.ink,
            fontSize: 36,
            fontWeight: '800',
            letterSpacing: -1,
            lineHeight: 42,
          }}
        >
          {atRiskCount}
        </Text>
        <Text style={{ color: colors.neutral.inkMuted, fontSize: 12, fontWeight: '500', marginTop: 2 }}>
          {t('manager.dashboard.tiles.atRiskSub', { defaultValue: 'need attention' })}
        </Text>
      </View>
    </View>
  );
}
