import Ionicons from '@expo/vector-icons/Ionicons';
import * as React from 'react';
import { I18nManager, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

/**
 * Top bar for the link-student screen — back button + brand title, centered.
 */
export function LinkHeader({ onBack, backLabel, title }: { onBack: () => void; backLabel: string; title: string }) {
  return (
    <View
      className="flex-row items-center px-4 py-3"
      style={{
        flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.rule,
        backgroundColor: colors.neutral.card,
      }}
    >
      <TouchableOpacity
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        testID="back-button"
        className="size-10 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.neutral.rule }}
      >
        <Ionicons
          name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'}
          size={24}
          color={colors.neutral.ink}
        />
      </TouchableOpacity>
      <Text className="flex-1 text-center text-base font-bold" style={{ color: colors.neutral.ink }}>
        {title}
      </Text>
      <View className="w-10" />
    </View>
  );
}

/**
 * Decorative school/link badge above the code field.
 */
export function LinkIllustration() {
  return (
    <View className="my-7 items-center">
      <View
        className="size-32 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.semantic.presentSoft }}
      >
        <Ionicons name="school" size={44} color={colors.brand.primary} />
        <View
          className="absolute size-8 items-center justify-center rounded-full"
          style={{
            bottom: 4,
            end: 4,
            backgroundColor: colors.brand.primary,
            borderWidth: 3,
            borderColor: colors.neutral.card,
          }}
        >
          <Ionicons name="link" size={18} color={colors.neutral.white} />
        </View>
      </View>
    </View>
  );
}
