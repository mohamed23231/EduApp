/**
 * SelectField — session-edit
 * A pressable row that opens a bottom-sheet picker (time / students).
 * Extracted from session-edit-screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type SelectFieldProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isPlaceholder: boolean;
  hasError?: boolean;
  count?: number;
  onPress: () => void;
};

export function SelectField({ icon, label, isPlaceholder, hasError, count, onPress }: SelectFieldProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.selectBtn, pressed && styles.selectBtnPressed, hasError && styles.selectBtnError]}
    >
      <Ionicons name={icon} size={18} color={isPlaceholder ? colors.neutral.inkMuted : colors.neutral.ink} />
      <Text style={[styles.selectBtnText, isPlaceholder && styles.selectBtnPlaceholder]} numberOfLines={1}>
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{count}</Text>
        </View>
      )}
      <Ionicons name="chevron-down" size={16} color={colors.neutral.inkMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: colors.neutral.paper,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral.rule,
  },
  selectBtnPressed: {
    backgroundColor: colors.semantic.presentSoft,
    borderColor: colors.brand.primary,
  },
  selectBtnError: {
    borderColor: colors.semantic.absent,
  },
  selectBtnText: {
    flex: 1,
    fontSize: 15,
    color: colors.neutral.ink,
  },
  selectBtnPlaceholder: {
    color: colors.neutral.inkMuted,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brand.primaryInk,
  },
});
