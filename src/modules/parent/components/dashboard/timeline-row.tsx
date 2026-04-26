import type { TimelineRecord } from '../../types';
import type { StatusKey } from '../../utils/dashboard-helpers';
import type { SupportedLocale } from '@/lib/date';
import * as React from 'react';
import { Text, View } from 'react-native';
import { Hairline, Icon } from '@/components/ui';
import colors from '@/components/ui/colors';
import { formatCalendarDay, formatTime } from '@/lib/date';
import { combineDateTime, deriveStatusKey } from '../../utils/dashboard-helpers';

/**
 * One row in the dashboard's RECENT timeline. Status-color circle on the
 * leading edge; status-derived title and meta line on the body. Hairline
 * divider between rows. Per `contracts/visual-parent.md`.
 */

const STATUS_ICON_BG: Record<StatusKey, { bg: string; fg: string; icon: 'check' | 'x' | 'clock' | 'sparkle' }> = {
  present: { bg: colors.semantic.presentSoft, fg: colors.semantic.present, icon: 'check' },
  absent: { bg: colors.semantic.absentSoft, fg: colors.semantic.absent, icon: 'x' },
  excused: { bg: colors.semantic.excusedSoft, fg: colors.semantic.excused, icon: 'clock' },
  none: { bg: colors.neutral.cardWarm, fg: colors.neutral.inkMuted, icon: 'sparkle' },
};

const STATUS_TITLE_KEY: Record<StatusKey, [string, string]> = {
  present: ['parent.dashboard.row.titlePresent', 'Marked present'],
  absent: ['parent.dashboard.row.titleAbsent', 'Marked absent'],
  excused: ['parent.dashboard.row.titleExcused', 'Excused'],
  none: ['parent.dashboard.row.titleNone', 'Not marked'],
};

export type TimelineRowProps = {
  record: TimelineRecord;
  isLast: boolean;
  isRTL: boolean;
  locale: SupportedLocale;
  t: (key: string, opts?: any) => string;
};

export function TimelineRow({ record, isLast, isRTL, locale, t }: TimelineRowProps) {
  const status = deriveStatusKey(record.status);
  const dayLabel = formatCalendarDay(record.date, locale);
  const timeLabel = formatTime(combineDateTime(record.date, record.time), locale);
  const iconStyle = STATUS_ICON_BG[status];
  const [titleKey, titleFallback] = STATUS_TITLE_KEY[status];
  const titleText = t(titleKey, { defaultValue: titleFallback });
  const meta = record.excuseNote
    ? `${dayLabel} · ${timeLabel} · ${record.excuseNote}`
    : `${dayLabel} · ${timeLabel}`;

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingVertical: 14,
          paddingHorizontal: 4,
        }}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: iconStyle.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={iconStyle.icon} size={18} color={iconStyle.fg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.neutral.ink,
              fontSize: 14,
              fontWeight: '700',
              letterSpacing: -0.1,
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={1}
          >
            {titleText}
          </Text>
          <Text
            style={{
              color: colors.neutral.inkMuted,
              fontSize: 12,
              fontWeight: '500',
              marginTop: 2,
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={2}
          >
            {meta}
          </Text>
        </View>
      </View>
      {!isLast ? <Hairline color={colors.neutral.rule} /> : null}
    </View>
  );
}
