/**
 * DangerZone — connection-code
 * Regenerate-code warning card with a destructive action.
 * Extracted from connection-code-screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type DangerZoneProps = {
  isRegenerating: boolean;
  onRegenerate: () => void;
  t: (k: string) => string;
};

export function DangerZone({ isRegenerating, onRegenerate, t }: DangerZoneProps) {
  return (
    <Animated.View entering={FadeInDown.delay(150).duration(400)}>
      <View style={styles.dangerCard}>
        <View style={styles.dangerRow}>
          <View style={styles.dangerIconCircle}>
            <Ionicons name="warning-outline" size={18} color={colors.semantic.absent} />
          </View>
          <View style={styles.dangerInfo}>
            <Text style={styles.dangerTitle}>{t('teacher.connectionCode.regenerateButton')}</Text>
            <Text style={styles.dangerDesc}>{t('teacher.connectionCode.regenerateWarning')}</Text>
          </View>
        </View>
        <Pressable
          onPress={onRegenerate}
          disabled={isRegenerating}
          style={({ pressed }) => [styles.regenBtn, pressed && styles.regenBtnPressed]}
          accessibilityRole="button"
        >
          {isRegenerating
            ? <ActivityIndicator size="small" color={colors.semantic.absent} />
            : <Ionicons name="refresh-outline" size={16} color={colors.semantic.absent} />}
          <Text style={styles.regenLabel}>
            {isRegenerating ? t('teacher.connectionCode.regenerating') : t('teacher.connectionCode.regenerateButton')}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dangerCard: {
    backgroundColor: colors.neutral.card,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.semantic.absentSoft,
  },
  dangerRow: { flexDirection: 'row', gap: 12 },
  dangerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.semantic.absentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dangerInfo: { flex: 1, gap: 4 },
  dangerTitle: { fontSize: 15, fontWeight: '700', color: colors.semantic.absentInk },
  dangerDesc: { fontSize: 13, color: colors.neutral.inkMuted, lineHeight: 18 },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.semantic.absentSoft,
    borderWidth: 1,
    borderColor: colors.semantic.absentSoft,
  },
  regenBtnPressed: { backgroundColor: colors.semantic.absentSoft },
  regenLabel: { fontSize: 14, fontWeight: '600', color: colors.semantic.absent },
});
