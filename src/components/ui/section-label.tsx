import * as React from 'react';
import { Pressable, Text, View } from 'react-native';

import colors from '@/components/ui/colors';

type SectionLabelProps = {
  children: string;
  meta?: string;
  action?: { label: string; onPress: () => void };
  dark?: boolean;
  testID?: string;
};

export function SectionLabel({
  children,
  meta,
  action,
  dark = false,
  testID,
}: SectionLabelProps) {
  const textColor = dark ? colors.neutral.paper : colors.neutral.ink;
  const metaColor = dark ? colors.neutral.dim : colors.neutral.inkMuted;

  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: textColor,
          }}
        >
          {children}
        </Text>
        {meta
          ? (
              <Text
                style={{
                  fontSize: 12,
                  color: metaColor,
                  marginStart: 8,
                }}
              >
                {meta}
              </Text>
            )
          : null}
      </View>
      {action
        ? (
            <Pressable onPress={action.onPress} hitSlop={8}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: colors.brand.primary,
                }}
              >
                {action.label}
              </Text>
            </Pressable>
          )
        : null}
    </View>
  );
}
