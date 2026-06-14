/**
 * WarningBanner — inline amber banner for session-closed / session-draft states.
 */

import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type WarningBannerProps = {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
};

export function WarningBanner({ icon, message }: WarningBannerProps) {
  return (
    <View
      className="flex-row items-center gap-2 px-5 py-3"
      style={{
        backgroundColor: colors.semantic.excusedSoft,
        borderBottomWidth: 1,
        borderBottomColor: `${colors.semantic.excused}60`,
      }}
    >
      <Ionicons name={icon} size={14} color={colors.semantic.excusedInk} />
      <Text style={{ fontSize: 13, color: colors.semantic.excusedInk, flex: 1 }}>{message}</Text>
    </View>
  );
}
