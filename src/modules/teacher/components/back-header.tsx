/**
 * BackHeader — shared teacher screen header with an RTL-aware back arrow.
 * Used by detail/sub screens (performance, rankings) that aren't tab roots.
 */

import { Ionicons } from '@expo/vector-icons';
import { I18nManager, Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type BackHeaderProps = {
  title: string;
  onBack: () => void;
  backLabel: string;
};

export function BackHeader({ title, onBack, backLabel }: BackHeaderProps) {
  return (
    <View
      className="flex-row items-center border-b border-rule px-4 py-3"
      style={{ backgroundColor: colors.neutral.card }}
    >
      <Pressable
        onPress={onBack}
        className="me-2 p-1"
        accessibilityRole="button"
        accessibilityLabel={backLabel}
      >
        <Ionicons
          name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'}
          size={24}
          color={colors.neutral.ink}
        />
      </Pressable>
      <Text className="flex-1 text-title font-bold text-ink" numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}
