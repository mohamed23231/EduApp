import type { StatusKey } from '../../utils/dashboard-helpers';
import type { SupportedLocale } from '@/lib/date';
import type { PerformanceRecord } from '@/shared/performance';
import * as React from 'react';
import { Text, View } from 'react-native';
import { Icon, Monogram, useMonogramTone } from '@/components/ui';
import colors from '@/components/ui/colors';
import { formatCalendarDay } from '@/lib/date';
import { deriveStatusKey } from '../../utils/dashboard-helpers';

const STATUS_OVERLAY: Record<StatusKey, { bg: string; fg: string; icon: 'check' | 'x' | 'clock' | 'sparkle' }> = {
  present: { bg: colors.semantic.presentSoft, fg: colors.semantic.present, icon: 'check' },
  absent: { bg: colors.semantic.absentSoft, fg: colors.semantic.absent, icon: 'x' },
  excused: { bg: colors.semantic.excusedSoft, fg: colors.semantic.excused, icon: 'clock' },
  none: { bg: colors.neutral.cardWarm, fg: colors.neutral.inkMuted, icon: 'sparkle' },
};

export type PerformanceRecordRowProps = {
  record: PerformanceRecord;
  isRTL: boolean;
  locale: SupportedLocale;
};

export function PerformanceRecordRow({ record, isRTL, locale }: PerformanceRecordRowProps) {
  const status = deriveStatusKey(record.status);
  const overlay = STATUS_OVERLAY[status];
  const tone = useMonogramTone(record.sessionInstanceId);
  const dayLabel = formatCalendarDay(record.date, locale);
  const meta = [record.teacherName, dayLabel].filter(Boolean).join(' · ');

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 14,
        backgroundColor: colors.neutral.card,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: colors.neutral.rule,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View style={{ position: 'relative' }}>
        <Monogram name={record.sessionSubject || '—'} tone={tone} size={42} />
        <View
          style={{
            position: 'absolute',
            bottom: -3,
            end: -3,
            width: 22,
            height: 22,
            borderRadius: 999,
            backgroundColor: overlay.bg,
            borderWidth: 2,
            borderColor: colors.neutral.paper,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={overlay.icon} size={12} color={overlay.fg} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.neutral.ink,
            fontSize: 14,
            fontWeight: '700',
            textAlign: isRTL ? 'right' : 'left',
          }}
          numberOfLines={1}
        >
          {record.sessionSubject || '—'}
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
          {meta}
        </Text>
      </View>
      {record.rating !== null
        ? (
            <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
              <Text
                style={{
                  color: colors.neutral.ink,
                  fontSize: 16,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                }}
              >
                {record.rating}
              </Text>
              <Text
                style={{
                  color: colors.neutral.inkMuted,
                  fontSize: 10,
                  fontWeight: '600',
                }}
              >
                / 10
              </Text>
            </View>
          )
        : null}
    </View>
  );
}
