/**
 * ActionButton — connection-code
 * Animated pressable action (copy / share / success) used inside the code card.
 * Extracted from connection-code-screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from '@/components/ui';

type ActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  variant: 'primary' | 'secondary' | 'success';
};

export function ActionButton({ icon, label, onPress, variant }: ActionButtonProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const colors = {
    primary: { bg: '#3B82F6', text: '#FFFFFF', ic: '#FFFFFF' },
    secondary: { bg: '#F1F5F9', text: '#334155', ic: '#64748B' },
    success: { bg: '#10B981', text: '#FFFFFF', ic: '#FFFFFF' },
  };
  const c = colors[variant];

  return (
    <Animated.View style={[{ flex: 1 }, animStyle]}>
      <Pressable
        onPress={onPress}
        // eslint-disable-next-line react-hooks/immutability
        onPressIn={() => { scale.value = withSpring(0.95); }}
        // eslint-disable-next-line react-hooks/immutability
        onPressOut={() => { scale.value = withSpring(1); }}
        style={[styles.actionBtn, { backgroundColor: c.bg }]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Ionicons name={icon} size={18} color={c.ic} />
        <Text style={[styles.actionLabel, { color: c.text }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionLabel: { fontSize: 14, fontWeight: '600' },
});
