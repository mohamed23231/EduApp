import * as React from 'react';
import { Pressable, Text } from 'react-native';
import { Icon } from '@/components/ui';
import colors from '@/components/ui/colors';

/**
 * Role selector pill used in the signup role row (TEACHER / PARENT / MANAGER).
 * Shared by the email and phone signup forms. Selected = brand-green tint +
 * border; otherwise frosted.
 */

export type RolePillIcon = 'graduationCap' | 'users' | 'building';

export type RolePillProps = {
  selected: boolean;
  label: string;
  iconName: RolePillIcon;
  onPress: () => void;
  testID?: string;
};

export function RolePill({ selected, label, iconName, onPress, testID }: RolePillProps) {
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
          ? 'rgba(34,197,114,0.16)'
          : pressed
            ? 'rgba(34,197,114,0.10)'
            : 'rgba(255,255,255,0.06)',
        borderWidth: 1.5,
        borderColor: selected ? colors.brand.primary : 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      })}
    >
      <Icon name={iconName} size={20} color={selected ? colors.brand.primary : colors.neutral.dim} />
      <Text
        style={{
          color: selected ? colors.neutral.white : colors.neutral.dim,
          fontSize: 12,
          fontWeight: '700',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
