/**
 * AttendanceSummary — 4-cell grid (Present / Absent / Excused / Unmarked).
 */

import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type AttendanceSummaryProps = {
  present: number;
  absent: number;
  excused: number;
  unmarked: number;
  totalMarked: number;
  total: number;
};

type CellProps = {
  label: string;
  value: number;
  soft: string;
  ink: string;
};

function Cell({ label, value, soft, ink }: CellProps) {
  return (
    <View className="flex-1 items-center rounded-xl px-2 py-2.5" style={{ backgroundColor: soft }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: ink, letterSpacing: -0.5 }}>{value}</Text>
      <Text style={{ fontSize: 9, letterSpacing: 1, fontWeight: '700', color: ink, opacity: 0.7, textTransform: 'uppercase', marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

export function AttendanceSummary({ present, absent, excused, unmarked, totalMarked, total }: AttendanceSummaryProps) {
  const { t } = useTranslation();
  const c = colors.semantic;

  return (
    <View
      className="mx-4 mb-4 rounded-r3 p-4"
      style={{ backgroundColor: colors.neutral.card, borderWidth: 1.5, borderColor: colors.neutral.rule }}
    >
      <View className="mb-3 flex-row items-baseline justify-between">
        <Text style={{ fontSize: 10, letterSpacing: 1.5, fontWeight: '700', color: colors.neutral.inkMuted, textTransform: 'uppercase' }}>
          {t('manager.sessionDetail.attendanceLabel', { defaultValue: 'Attendance' })}
        </Text>
        <Text style={{ fontSize: 11, color: colors.neutral.inkMuted, fontWeight: '600' }}>
          {t('manager.sessionDetail.markedOf', { marked: totalMarked, total, defaultValue: '{{marked}}/{{total}} marked' })}
        </Text>
      </View>
      <View className="flex-row gap-1.5">
        <Cell label={t('manager.attendance.present', { defaultValue: 'Present' })} value={present} soft={c.presentSoft} ink={c.presentInk} />
        <Cell label={t('manager.attendance.absent', { defaultValue: 'Absent' })} value={absent} soft={c.absentSoft} ink={c.absentInk} />
        <Cell label={t('manager.attendance.excused', { defaultValue: 'Excused' })} value={excused} soft={c.excusedSoft} ink={c.excusedInk} />
        <Cell label={t('manager.sessionDetail.unmarked', { defaultValue: 'Unmarked' })} value={unmarked} soft={colors.neutral.cardWarm} ink={colors.neutral.inkSoft} />
      </View>
    </View>
  );
}
