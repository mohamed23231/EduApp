import * as React from 'react';
import { Text, View } from 'react-native';
import colors from '@/components/ui/colors';

type MonogramTone = 'indigo' | 'rose' | 'teal' | 'amber' | 'violet' | 'sky' | 'lime' | 'present' | 'absent' | 'excused' | 'ink';

type MonogramProps = {
  name: string;
  tone?: MonogramTone;
  size?: number;
  ring?: boolean;
  square?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

const TONE_MAP: Record<MonogramTone, { bg: string; fg: string }> = {
  indigo: { bg: colors.avatarBg.indigo, fg: colors.avatar.indigo },
  rose: { bg: colors.avatarBg.rose, fg: colors.avatar.rose },
  teal: { bg: colors.avatarBg.teal, fg: colors.avatar.teal },
  amber: { bg: colors.avatarBg.amber, fg: colors.avatar.amber },
  violet: { bg: colors.avatarBg.violet, fg: colors.avatar.violet },
  sky: { bg: colors.avatarBg.sky, fg: colors.avatar.sky },
  lime: { bg: colors.avatarBg.lime, fg: colors.avatar.lime },
  present: { bg: colors.semantic.presentSoft, fg: colors.semantic.presentInk },
  absent: { bg: colors.semantic.absentSoft, fg: colors.semantic.absentInk },
  excused: { bg: colors.semantic.excusedSoft, fg: colors.semantic.excusedInk },
  ink: { bg: colors.neutral.ink, fg: colors.neutral.card },
};

const ROTATING_TONES: MonogramTone[] = ['indigo', 'rose', 'teal', 'amber', 'violet', 'sky', 'lime'];

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const second = words[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

export function useMonogramTone(id: string | undefined | null): MonogramTone {
  const safe = id ?? '';
  const hash = Array.from(safe).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return ROTATING_TONES[hash % ROTATING_TONES.length];
}

export function Monogram({
  name,
  tone = 'indigo',
  size = 48,
  ring = false,
  square = false,
  accessibilityLabel,
  testID,
}: MonogramProps) {
  const initials = getInitials(name);
  const { bg, fg } = TONE_MAP[tone];
  const fontSize = Math.round(size * 0.38);

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? `Avatar for ${name}`}
      accessibilityRole="image"
      style={{
        width: size,
        height: size,
        borderRadius: square ? colors.radii.r2 : size / 2,
        backgroundColor: bg,
        borderWidth: ring ? 2 : 0,
        borderColor: ring ? colors.brand.primary : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize,
          fontWeight: '600',
          color: fg,
          lineHeight: fontSize + 2,
          includeFontPadding: false,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
