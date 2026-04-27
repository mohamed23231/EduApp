import type { TFunction } from 'i18next';
import type { CurrentSession, TimelineRecord, UpcomingSession } from '../../types';
import type { SupportedLocale } from '@/lib/date';
import * as React from 'react';
import { Text, View } from 'react-native';
import { BigNumber, Dot } from '@/components/ui';
import colors from '@/components/ui/colors';
import { buildHeroDescriptor } from './parent-hero-descriptor';

/**
 * ParentHero — the single-sentence answer the parent opened the app to read.
 *
 * State machine, highest priority first:
 *   1. live   — child is in a session right now
 *   2. next   — there's an upcoming session
 *   3. past   — most recent timeline record
 *   4. none   — no records yet
 *
 * All copy + color decisions live in `parent-hero-descriptor.ts`. This file
 * only owns the layout.
 */

export type ParentHeroProps = {
  studentFirstName: string;
  currentSession: CurrentSession | undefined;
  upcomingSession: UpcomingSession | undefined;
  todayRecord: TimelineRecord | null;
  attendanceRate: number | undefined;
  isRTL: boolean;
  locale: SupportedLocale;
  t: TFunction;
};

export function ParentHero(props: ParentHeroProps) {
  const { attendanceRate, isRTL, t } = props;
  const descriptor = buildHeroDescriptor(props);
  const hasRate = typeof attendanceRate === 'number' && !Number.isNaN(attendanceRate);

  return (
    <View
      style={{
        marginHorizontal: 16,
        backgroundColor: colors.neutral.ink,
        borderRadius: 24,
        padding: 22,
        position: 'relative',
        overflow: 'hidden',
      }}
      testID="parent-hero"
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -40,
          end: -40,
          width: 180,
          height: 180,
          borderRadius: 999,
          backgroundColor: colors.brand.primary,
          opacity: descriptor.mode === 'live' ? 0.28 : 0.18,
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Dot size={8} color={descriptor.dotColor} pulse={descriptor.pulse} />
        <Text style={{ color: descriptor.tagColor, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>
          {descriptor.tagText}
        </Text>
      </View>
      <Text
        style={{
          color: colors.neutral.white,
          fontSize: 28,
          fontWeight: '700',
          letterSpacing: -1,
          lineHeight: 32,
          textAlign: isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        }}
      >
        {descriptor.headline}
      </Text>
      {descriptor.highlight
        ? (
            <Text
              style={{
                color: colors.brand.primary,
                fontSize: 22,
                fontWeight: '700',
                letterSpacing: -0.6,
                lineHeight: 28,
                marginTop: 4,
                textAlign: isRTL ? 'right' : 'left',
                writingDirection: isRTL ? 'rtl' : 'ltr',
              }}
              numberOfLines={1}
            >
              {descriptor.highlight}
            </Text>
          )
        : null}
      <Text
        style={{
          color: colors.neutral.dim,
          fontSize: 14,
          fontWeight: '500',
          marginTop: 8,
          textAlign: isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        }}
      >
        {descriptor.sub}
      </Text>
      {hasRate
        ? (
            <View
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: 'rgba(255,255,255,0.10)',
                flexDirection: 'row',
                alignItems: 'baseline',
                gap: 10,
              }}
            >
              <BigNumber
                value={Math.round(attendanceRate as number)}
                suffix="%"
                size={44}
                weight={700}
                color={colors.neutral.white}
              />
              <Text style={{ color: colors.neutral.dim, fontSize: 13, fontWeight: '600', letterSpacing: 0.3 }}>
                {t('parent.dashboard.hero.rateLabel', 'attendance · last 30 days')}
              </Text>
            </View>
          )
        : null}
    </View>
  );
}
