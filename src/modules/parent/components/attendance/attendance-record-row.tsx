import type { TFunction } from 'i18next';
import type { AttendanceRecord } from '../../types/student.types';
import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

/**
 * One attendance row on the parent attendance screen. Paper-canvas card with a
 * hairline border + a leading status accent (fully-inline `borderStart*` to
 * stay RTL-safe per the project gotcha). A purpose-built status pill carries
 * the four `parent.attendance.status*` labels — we don't reuse the generic
 * `StatusChip` here because its `pending` label ("Pending") would not match the
 * required "Not Marked" label for NOT_MARKED records.
 */

type StatusVisual = { accent: string; bg: string; fg: string; labelKey: string; fallback: string };

function statusVisual(status: AttendanceRecord['status']): StatusVisual {
  switch (status) {
    case 'PRESENT':
      return { accent: colors.semantic.present, bg: colors.semantic.presentSoft, fg: colors.semantic.presentInk, labelKey: 'parent.attendance.statusPresent', fallback: 'Present' };
    case 'ABSENT':
      return { accent: colors.semantic.absent, bg: colors.semantic.absentSoft, fg: colors.semantic.absentInk, labelKey: 'parent.attendance.statusAbsent', fallback: 'Absent' };
    case 'EXCUSED':
      return { accent: colors.semantic.excused, bg: colors.semantic.excusedSoft, fg: colors.semantic.excusedInk, labelKey: 'parent.attendance.statusExcused', fallback: 'Excused' };
    case 'NOT_MARKED':
    default:
      return { accent: colors.neutral.rule, bg: colors.neutral.cardWarm, fg: colors.neutral.inkMuted, labelKey: 'parent.attendance.statusNotMarked', fallback: 'Not Marked' };
  }
}

type AttendanceRecordRowProps = {
  item: AttendanceRecord;
  isRTL: boolean;
  t: TFunction;
};

export function AttendanceRecordRow({ item, isRTL, t }: AttendanceRecordRowProps) {
  const visual = statusVisual(item.status);
  return (
    <View
      style={{
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.neutral.card,
        borderColor: colors.neutral.rule,
        borderWidth: 1,
        borderStartWidth: 4,
        borderStartColor: visual.accent,
        borderRadius: colors.radii.r3,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 10,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontSize: 15, fontWeight: '700', color: colors.neutral.ink, textAlign: isRTL ? 'right' : 'left' }}
          numberOfLines={1}
        >
          {item.sessionName}
        </Text>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Ionicons name="time-outline" size={13} color={colors.neutral.inkMuted} />
          <Text style={{ fontSize: 12, fontWeight: '500', color: colors.neutral.inkMuted }}>
            {item.sessionDate}
          </Text>
          {item.teacherName
            ? (
                <>
                  <Text style={{ color: colors.neutral.dim }}>·</Text>
                  <Ionicons name="person-outline" size={13} color={colors.neutral.inkMuted} />
                  <Text style={{ fontSize: 12, fontWeight: '500', color: colors.neutral.inkMuted }} numberOfLines={1}>
                    {item.teacherName}
                  </Text>
                </>
              )
            : null}
        </View>
      </View>
      <View
        accessibilityRole="text"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: visual.bg,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 5,
        }}
      >
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: visual.accent }} />
        <Text style={{ fontSize: 12, fontWeight: '700', color: visual.fg }}>
          {t(visual.labelKey, visual.fallback)}
        </Text>
      </View>
    </View>
  );
}
