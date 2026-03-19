import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Text } from '@/components/ui';

const STATUS_COLORS = {
  present: '#22C55E',
  absent: '#EF4444',
  excused: '#F59E0B',
};

type StatItemProps = {
  color: string;
  label: string;
  count: number;
};

function StatItem({ color, label, count }: StatItemProps) {
  return (
    <View className="flex-1 items-center">
      <View className="mb-1 flex-row items-center">
        <View className="me-1 size-2 rounded-full" style={{ backgroundColor: color }} />
        <Text className="text-xs text-gray-500">{label}</Text>
      </View>
      <Text className="text-xl font-bold text-gray-900">{count}</Text>
    </View>
  );
}

type AttendanceStatCardProps = {
  present: number;
  absent: number;
  excused: number;
};

export function AttendanceStatCard({ present, absent, excused }: AttendanceStatCardProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row px-2 py-4">
      <StatItem color={STATUS_COLORS.present} label={t('parent.attendance.statusPresent')} count={present} />
      <StatItem color={STATUS_COLORS.absent} label={t('parent.attendance.statusAbsent')} count={absent} />
      <StatItem color={STATUS_COLORS.excused} label={t('parent.attendance.statusExcused')} count={excused} />
    </View>
  );
}
