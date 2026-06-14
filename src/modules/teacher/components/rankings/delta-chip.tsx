/**
 * DeltaChip — trend indicator for rankings rows.
 * null   → "NEW" badge (no prior session)
 * 'stable' → "—" label
 * 'up'   → lime ▲
 * 'down' → absentSoft ▼
 */

import type { TrendIndicator } from '@/shared/performance';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type Props = { trend: TrendIndicator };

export function DeltaChip({ trend }: Props) {
  if (trend == null) {
    return (
      <View className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: colors.neutral.paper }}>
        <Text className="text-micro font-bold" style={{ color: colors.neutral.inkMuted, letterSpacing: 0.3 }}>
          NEW
        </Text>
      </View>
    );
  }
  if (trend === 'stable') {
    return (
      <Text className="px-1.5 py-0.5 text-micro font-bold" style={{ color: colors.neutral.inkMuted }}>
        —
      </Text>
    );
  }
  const up = trend === 'up';
  return (
    <View
      className="flex-row items-center gap-0.5 rounded-md px-1.5 py-0.5"
      style={{ backgroundColor: up ? colors.brand.primary : colors.semantic.absentSoft }}
    >
      <Text className="text-caption font-bold" style={{ color: up ? colors.neutral.ink : colors.semantic.absentInk }}>
        {up ? '▲' : '▼'}
      </Text>
    </View>
  );
}
