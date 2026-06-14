/**
 * SessionStatsTiles — 4-cell stat grid for SessionDetailScreen (30-day window).
 */

import type { OrgSessionInstance } from '../../types/manager.types';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SectionLabel, Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type SessionStatsTilesProps = {
  instances: OrgSessionInstance[];
};

export function SessionStatsTiles({ instances }: SessionStatsTilesProps) {
  const { t } = useTranslation();
  const c = colors;

  const closed = instances.filter(i => i.state === 'CLOSED').length;
  const active = instances.filter(i => i.state === 'ACTIVE').length;
  const upcoming = instances.filter(i => i.state === 'DRAFT').length;
  const total = instances.length;

  const tiles = [
    { label: t('manager.sessionDetail.statsCompleted', { defaultValue: 'Completed' }), value: closed, soft: c.semantic.presentSoft, ink: c.semantic.presentInk },
    { label: t('manager.sessionDetail.statsActive', { defaultValue: 'Active' }), value: active, soft: c.semantic.infoSoft, ink: c.semantic.info },
    { label: t('manager.sessionDetail.statsUpcoming', { defaultValue: 'Upcoming' }), value: upcoming, soft: c.semantic.excusedSoft, ink: c.semantic.excusedInk },
    { label: t('manager.sessionDetail.statsTotal', { defaultValue: 'Total' }), value: total, soft: c.neutral.cardWarm, ink: c.neutral.inkSoft },
  ];

  return (
    <View className="mb-4 px-4">
      <SectionLabel>{t('manager.sessionDetail.statsTitle', { defaultValue: 'Statistics (30 days)' })}</SectionLabel>
      <View className="mt-3 flex-row gap-2">
        {tiles.map(stat => (
          <View key={stat.label} className="flex-1 items-center rounded-2xl py-3" style={{ backgroundColor: stat.soft }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: stat.ink, letterSpacing: -0.5 }}>{stat.value}</Text>
            <Text style={{ fontSize: 9, fontWeight: '700', color: stat.ink, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2, textAlign: 'center' }}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
