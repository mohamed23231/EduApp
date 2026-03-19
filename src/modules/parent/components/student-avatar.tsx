import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { Color } from '@/components/ui/color-utils';

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
  const index = Math.abs(hash);
  return Color.avatar.getColor(index);
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
      className="items-center"
    >
      <View
        className="items-center justify-center"
        style={{
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          borderWidth: 2.5,
          borderColor: selected ? '#3478F6' : 'transparent',
        }}
      >
        <View
          className="items-center justify-center"
          style={{
            width: container,
            height: container,
            borderRadius: container / 2,
            backgroundColor: bgColor,
          }}
        >
          <Text className="font-bold text-white" style={{ fontSize }}>{initials}</Text>
        </View>
      </View>
    </Pressable>
  );
}
