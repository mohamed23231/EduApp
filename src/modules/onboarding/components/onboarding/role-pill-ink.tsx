import * as React from 'react';
import { Pressable, Text } from 'react-native';
import { Icon } from '@/components/ui';
import colors from '@/components/ui/colors';

type RolePillProps = {
  selected: boolean;
  label: string;
  iconName: 'graduationCap' | 'users';
  onPress: () => void;
  testID?: string;
};

export function RolePillInk({ selected, label, iconName, onPress, testID }: RolePillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      testID={testID}
      style={({ pressed }) => ({
        flex: 1,
        height: 64,
        borderRadius: 16,
        paddingHorizontal: 8,
        backgroundColor: selected
          ? 'rgba(34,197,114,0.10)'
          : pressed
            ? colors.neutral.cardWarm
            : colors.neutral.card,
        borderWidth: 1.5,
        borderColor: selected ? colors.brand.primary : colors.neutral.rule,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      })}
    >
      <Icon
        name={iconName}
        size={20}
        color={selected ? colors.brand.primary : colors.neutral.inkMuted}
      />
      <Text
        style={{
          color: selected ? colors.neutral.ink : colors.neutral.inkSoft,
          fontSize: 12,
          fontWeight: '700',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
