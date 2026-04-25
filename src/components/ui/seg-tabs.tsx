import type { PressableProps } from 'react-native';
import * as React from 'react';
import { Pressable, Text, View } from 'react-native';

import colors from '@/components/ui/colors';

type SegTabsProps<T extends string> = {
  tabs: readonly T[];
  active: T;
  onChange: (next: T) => void;
  compact?: boolean;
  dark?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

function SegTab<T extends string>({
  tab,
  isActive,
  onPress,
  compact,
  dark,
  testID,
}: {
  tab: T;
  isActive: boolean;
  onPress: PressableProps['onPress'];
  compact?: boolean;
  dark?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      testID={testID}
      style={[
        {
          borderRadius: 9999,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: compact ? 12 : 18,
          paddingVertical: compact ? 6 : 10,
          backgroundColor: isActive ? colors.brand.primary : 'transparent',
        },
      ]}
    >
      <Text
        style={[
          {
            fontSize: compact ? 12 : 14,
            fontWeight: '600',
            color: isActive
              ? colors.brand.primaryInk
              : dark
                ? colors.neutral.dim
                : colors.neutral.inkMuted,
          },
        ]}
      >
        {tab}
      </Text>
    </Pressable>
  );
}

export function SegTabs<T extends string>({
  tabs,
  active,
  onChange,
  compact = false,
  dark = false,
  accessibilityLabel,
  testID,
}: SegTabsProps<T>) {
  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          flexDirection: 'row',
          borderRadius: 9999,
          padding: 4,
          borderWidth: 1,
          borderColor: dark ? colors.neutral.bgElev : colors.neutral.rule,
          backgroundColor: dark ? colors.neutral.bgElev : 'transparent',
          alignItems: 'center',
        },
      ]}
    >
      {tabs.map(tab => (
        <SegTab
          key={tab}
          tab={tab}
          isActive={tab === active}
          onPress={() => onChange(tab)}
          compact={compact}
          dark={dark}
          testID={testID ? `${testID}-${tab}` : undefined}
        />
      ))}
    </View>
  );
}
