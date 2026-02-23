import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';

export const AVATAR_COLORS = [
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F43F5E',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#14B8A6',
  '#06B6D4',
  '#3B82F6',
  '#A855F7',
  '#E11D48',
];

export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed)
    return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

const SIZE_MAP = {
  sm: { container: 32, fontSize: 12, ring: 36 },
  md: { container: 48, fontSize: 16, ring: 54 },
  lg: { container: 64, fontSize: 22, ring: 72 },
};

type StudentAvatarProps = {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onPress?: () => void;
};

export function StudentAvatar({ name, size = 'md', selected = false, onPress }: StudentAvatarProps) {
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);
  const { container, fontSize, ring } = SIZE_MAP[size];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${selected ? 'selected' : 'not selected'}`}
      style={styles.pressable}
    >
      <View
        style={[
          styles.ringContainer,
          {
            width: ring,
            height: ring,
            borderRadius: ring / 2,
            borderColor: selected ? '#6366F1' : 'transparent',
          },
        ]}
      >
        <View
          style={[
            styles.avatar,
            {
              width: container,
              height: container,
              borderRadius: container / 2,
              backgroundColor: bgColor,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
