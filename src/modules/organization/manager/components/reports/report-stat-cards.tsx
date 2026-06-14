import type { OrgStatsOverview } from '../../types/manager.types';
import { useTranslation } from 'react-i18next';
import { Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';

type ReportStatCardsProps = {
  overview: OrgStatsOverview | undefined;
};

function buildCards(overview: OrgStatsOverview | undefined, t: (key: string, opts: { defaultValue: string }) => string): [string, string | number][] {
  return [
    [t('manager.reports.cards.totalSessions', { defaultValue: 'Total sessions' }), overview?.totalSessions ?? 0],
    [t('manager.reports.cards.completed', { defaultValue: 'Completed' }), overview?.completedSessions ?? 0],
    [t('manager.reports.cards.attendanceRate', { defaultValue: 'Attendance rate' }), `${overview?.averageAttendanceRate ?? 0}%`],
    [t('manager.reports.cards.averageRating', { defaultValue: 'Average rating' }), overview?.averagePerformanceRating ?? 0],
    [t('manager.reports.cards.absentCount', { defaultValue: 'Absent' }), overview?.absentCount ?? 0],
    [t('manager.reports.cards.excusedCount', { defaultValue: 'Excused' }), overview?.excusedCount ?? 0],
  ];
}

export function ReportStatCards({ overview }: ReportStatCardsProps) {
  const { t } = useTranslation();
  const cards = buildCards(overview, t);
  return (
    <View className="mt-5 flex-row flex-wrap gap-3">
      {cards.map(([label, value]) => (
        <View
          key={String(label)}
          className="min-w-[47%] flex-1 rounded-2xl p-4"
          style={{ backgroundColor: colors.neutral.card }}
        >
          <Text className="text-sm" style={{ color: colors.neutral.inkMuted }}>{label}</Text>
          <Text className="mt-2 text-3xl font-semibold" style={{ color: colors.neutral.ink }}>
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}
