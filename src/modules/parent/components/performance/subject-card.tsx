import type { SubjectAggregate } from '../../utils/performance-aggregates';
import * as React from 'react';
import { Text, View } from 'react-native';
import { Icon, RatingBar, useMonogramTone } from '@/components/ui';
import colors from '@/components/ui/colors';

export type SubjectCardProps = {
  subject: SubjectAggregate;
  isRTL: boolean;
  attendanceLabel: string;
  outOfTen: string;
};

const TONE_BG: Record<string, { bg: string; fg: string }> = {
  indigo: { bg: '#E0E7FF', fg: '#4338CA' },
  rose: { bg: '#FFE4E6', fg: '#BE123C' },
  teal: { bg: '#CCFBF1', fg: '#0F766E' },
  amber: { bg: '#FFEDD0', fg: '#B45309' },
  violet: { bg: '#EDE4FF', fg: '#6D28D9' },
  sky: { bg: '#DCECFF', fg: '#0369A1' },
  lime: { bg: '#ECFCCB', fg: '#3F6212' },
};

export function SubjectCard({ subject, isRTL, attendanceLabel, outOfTen }: SubjectCardProps) {
  const tone = useMonogramTone(subject.subject);
  const palette = TONE_BG[tone] ?? TONE_BG.indigo;
  const rating = subject.averageRating ?? 0;

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 10,
        padding: 16,
        backgroundColor: colors.neutral.card,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.neutral.rule,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: palette.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="book" size={20} color={palette.fg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.neutral.ink,
              fontSize: 16,
              fontWeight: '700',
              letterSpacing: -0.2,
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={1}
          >
            {subject.subject}
          </Text>
          <Text
            style={{
              color: colors.neutral.inkMuted,
              fontSize: 12,
              fontWeight: '500',
              marginTop: 2,
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={1}
          >
            {attendanceLabel.replace('{{rate}}', String(subject.attendanceRate))}
          </Text>
        </View>
        <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
          <Text
            style={{
              color: colors.neutral.ink,
              fontSize: 22,
              fontWeight: '700',
              letterSpacing: -0.5,
            }}
          >
            {subject.averageRating !== null ? subject.averageRating.toFixed(1) : '—'}
          </Text>
          <Text
            style={{
              color: colors.neutral.inkMuted,
              fontSize: 10,
              fontWeight: '600',
            }}
          >
            {outOfTen}
          </Text>
        </View>
      </View>
      <RatingBar value={rating} max={10} height={8} />
    </View>
  );
}
