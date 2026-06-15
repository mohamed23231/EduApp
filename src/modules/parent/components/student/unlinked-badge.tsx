import * as React from 'react';
import { Text, View } from 'react-native';
import colors from '@/components/ui/colors';

/**
 * Small amber pill marking a child as unlinked in list/row contexts
 * (students list, dashboard child switcher). Presentational — the caller
 * passes the already-translated label. Uses the `excused`/warning semantic
 * token (amber) per the Parent States Pass child-unlinked treatment.
 */

export type UnlinkedBadgeProps = {
  label: string;
};

export function UnlinkedBadge({ label }: UnlinkedBadgeProps) {
  return (
    <View
      testID="unlinked-badge"
      style={{
        alignSelf: 'flex-start',
        backgroundColor: colors.semantic.excusedSoft,
        borderWidth: 1,
        borderColor: colors.semantic.excused,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
      }}
    >
      <Text
        style={{
          color: colors.semantic.excusedInk,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
