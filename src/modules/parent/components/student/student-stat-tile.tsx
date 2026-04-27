import * as React from 'react';
import { Text, View } from 'react-native';
import colors from '@/components/ui/colors';

export type StudentStatTileProps = {
  label: string;
  value: string;
  isRTL: boolean;
  highlight?: boolean;
};

export function StudentStatTile({ label, value, isRTL, highlight }: StudentStatTileProps) {
  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.12)',
        borderRadius: 16,
      }}
    >
      <Text
        style={{
          color: colors.neutral.dim,
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 1,
          textAlign: isRTL ? 'right' : 'left',
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        style={{
          color: highlight ? colors.brand.primary : colors.neutral.white,
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.5,
          marginTop: 4,
          textAlign: isRTL ? 'right' : 'left',
        }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
