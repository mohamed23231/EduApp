import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';

type StatItemProps = {
  color: string;
  label: string;
  count: number;
};

function StatItem({ color, label, count }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <View style={styles.statLabelRow}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statCount}>{count}</Text>
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
    <View style={styles.container}>
      <StatItem color="#22C55E" label={t('parent.attendance.statusPresent')} count={present} />
      <StatItem color="#EF4444" label={t('parent.attendance.statusAbsent')} count={absent} />
      <StatItem color="#F59E0B" label={t('parent.attendance.statusExcused')} count={excused} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginEnd: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
});
