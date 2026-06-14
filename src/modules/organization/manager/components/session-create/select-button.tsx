import type { Ionicons } from '@expo/vector-icons';
import { Ionicons as IoniconsIcon } from '@expo/vector-icons';
import { View } from 'react-native';
import { Pressable, Text } from '@/components/ui';
import colors from '@/components/ui/colors';

export function SelectButton({
  icon,
  placeholder,
  value,
  badge,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value?: string;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 13,
        backgroundColor: pressed ? colors.neutral.cardWarm : colors.neutral.card,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: colors.neutral.rule,
      })}
      accessibilityRole="button"
    >
      <IoniconsIcon name={icon} size={18} color={value ? colors.neutral.ink : colors.neutral.dim} />
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: '600',
          color: value ? colors.neutral.ink : colors.neutral.dim,
        }}
        numberOfLines={1}
      >
        {value || placeholder}
      </Text>
      {badge !== undefined && badge > 0
        ? (
            <View
              style={{
                minWidth: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: colors.brand.primary,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 6,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.neutral.white }}>
                {badge}
              </Text>
            </View>
          )
        : null}
      <IoniconsIcon name="chevron-down" size={16} color={colors.neutral.inkMuted} />
    </Pressable>
  );
}
