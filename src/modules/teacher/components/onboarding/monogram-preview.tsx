/**
 * MonogramPreview + TonePicker — onboarding step 1 sub-components.
 */

import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

export const TONE_PALETTE: Record<string, string> = {
  tone1: '#FFD8C2',
  tone2: '#FFC9D9',
  tone3: '#D8E1FF',
  tone4: '#D8F0CC',
  tone5: '#FFE6A3',
  tone6: '#E1D8FF',
};
export const TONES = Object.keys(TONE_PALETTE);

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1 && parts[0].length > 0)
    return parts[0].slice(0, 2).toUpperCase();
  return '?';
}

export function MonogramPreview({ name, tone }: { name: string; tone: string }) {
  const bg = TONE_PALETTE[tone] ?? colors.neutral.paper;
  const initials = name.trim().length > 0 ? getInitials(name) : '?';
  return (
    <View className="size-[88px] items-center justify-center rounded-full" style={{ backgroundColor: bg }}>
      <Text className="text-[32px] font-bold" style={{ color: colors.neutral.ink }}>{initials}</Text>
    </View>
  );
}

export function TonePicker({ selected, onChange }: { selected: string; onChange: (t: string) => void }) {
  return (
    <View className="flex-row gap-2">
      {TONES.map(tone => (
        <Pressable
          key={tone}
          onPress={() => onChange(tone)}
          accessibilityRole="button"
          className="flex-1 rounded-xl"
          style={({ pressed }) => ({
            height: 36,
            backgroundColor: TONE_PALETTE[tone],
            borderWidth: selected === tone ? 2.5 : 0,
            borderColor: colors.neutral.ink,
            opacity: pressed ? 0.85 : 1,
          })}
        />
      ))}
    </View>
  );
}
