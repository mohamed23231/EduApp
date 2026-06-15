/**
 * DashboardQuickActions — create-student / create-session shortcut cards.
 * Extracted from dashboard-screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type QuickActionCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  iconBg: string;
  iconColor: string;
};

function QuickActionCard({ icon, label, onPress, iconBg, iconColor }: QuickActionCardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(0.95, { damping: 15 });
  };
  const handlePressOut = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
        accessibilityRole="button"
      >
        <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={styles.actionLabel} numberOfLines={1}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

type DashboardQuickActionsProps = {
  onCreateStudent: () => void;
  onCreateSession: () => void;
  t: (key: string) => string;
};

export function DashboardQuickActions({ onCreateStudent, onCreateSession, t }: DashboardQuickActionsProps) {
  return (
    <View style={styles.actionsGrid}>
      <QuickActionCard
        icon="person-add-outline"
        label={t('teacher.students.createButton')}
        onPress={onCreateStudent}
        iconBg={colors.brand.primaryGlow}
        iconColor={colors.brand.primaryDeep}
      />
      <QuickActionCard
        icon="calendar-outline"
        label={t('teacher.sessions.createTitle')}
        onPress={onCreateSession}
        iconBg={colors.semantic.presentSoft}
        iconColor={colors.semantic.presentInk}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionCardPressed: { backgroundColor: '#F0F7FF', borderColor: '#BFDBFE' },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151' },
});
