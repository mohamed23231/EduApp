/**
 * AttendanceHeader — dark hero card with day rollup stats (marked/total, present%).
 */

import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type AttendanceHeaderProps = {
  marked: number;
  total: number;
  present: number;
  absent: number;
  excused: number;
  unmarked: number;
  live: number;
};

export function AttendanceHeader({ marked, total, present, absent, excused, unmarked, live }: AttendanceHeaderProps) {
  const { t } = useTranslation();
  const c = colors;
  const presentPct = total ? Math.round((present / Math.max(marked, 1)) * 100) : 0;

  const segments = [
    { value: present, color: c.semantic.present },
    { value: absent, color: c.semantic.absent },
    { value: excused, color: c.semantic.excused },
    { value: unmarked, color: 'rgba(255,255,255,0.18)' },
  ].filter(s => s.value > 0);

  const totalSeg = segments.reduce((s, x) => s + x.value, 0);

  return (
    <View className="mx-4 mb-3.5 overflow-hidden rounded-[22px] p-4" style={{ backgroundColor: c.neutral.ink }}>
      {/* Glow */}
      <View style={{ position: 'absolute', top: -50, end: -50, width: 200, height: 200, borderRadius: 999, backgroundColor: c.brand.primary, opacity: 0.28 }} />

      {/* marked/total */}
      <View className="flex-row items-baseline gap-3">
        <Text style={{ fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 }}>
          {marked}
          /
          {total}
        </Text>
        <Text style={{ fontSize: 13, color: c.neutral.dim, fontWeight: '600' }}>
          {t('manager.orgAttendance.marked', { defaultValue: 'marked' })}
        </Text>
      </View>

      {/* present % */}
      <View className="mt-1 flex-row items-baseline gap-2">
        <Text style={{ fontSize: 28, fontWeight: '800', color: c.brand.primary, letterSpacing: -0.5 }}>
          {presentPct}
          %
        </Text>
        <Text style={{ fontSize: 12, color: c.neutral.dim, fontWeight: '500' }}>
          {t('manager.orgAttendance.presentRate', { defaultValue: 'present rate' })}
        </Text>
      </View>

      {/* Segmented bar */}
      {totalSeg > 0 && (
        <View className="mt-3.5 h-2 flex-row gap-1">
          {segments.map((seg, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <View key={i} style={{ flex: seg.value / totalSeg, height: 8, backgroundColor: seg.color, borderRadius: 999 }} />
          ))}
        </View>
      )}

      {/* Legend */}
      <View className="mt-3 flex-row flex-wrap gap-3.5">
        {[
          { label: t('manager.attendance.present', { defaultValue: 'present' }), value: present, color: c.semantic.present },
          { label: t('manager.attendance.absent', { defaultValue: 'absent' }), value: absent, color: c.semantic.absent },
          { label: t('manager.attendance.excused', { defaultValue: 'excused' }), value: excused, color: c.semantic.excused },
        ].map(leg => (
          <View key={leg.label} className="flex-row items-center gap-1">
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: leg.color }} />
            <Text style={{ fontSize: 12, color: c.neutral.dim, fontWeight: '600' }}>
              {leg.value}
              {' '}
              {leg.label}
            </Text>
          </View>
        ))}
        {live > 0 && (
          <View className="flex-row items-center gap-1">
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.brand.primary }} />
            <Text style={{ fontSize: 12, color: c.brand.primary, fontWeight: '700' }}>
              {live}
              {' '}
              {t('manager.orgAttendance.live', { defaultValue: 'live' })}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
