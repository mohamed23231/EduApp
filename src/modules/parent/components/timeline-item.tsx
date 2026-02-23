import type { AttendanceStatus } from '@/modules/parent/types';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';

const STATUS_ICON: Record<AttendanceStatus, string> = {
  PRESENT: '✅',
  ABSENT: '❌',
  EXCUSED: '⚠️',
  NOT_MARKED: '➖',
};

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  PRESENT: '#22C55E',
  ABSENT: '#EF4444',
  EXCUSED: '#F59E0B',
  NOT_MARKED: '#9CA3AF',
};

type TimelineItemProps = {
  date: string;
  time: string;
  status: AttendanceStatus;
  excuseNote?: string;
};

export function TimelineItem({ date, time, status, excuseNote }: TimelineItemProps) {
  const { t } = useTranslation();
  const badgeBg = `${STATUS_COLOR[status]}20`;
  const statusLabelMap: Record<AttendanceStatus, string> = {
    PRESENT: t('parent.attendance.statusPresent'),
    ABSENT: t('parent.attendance.statusAbsent'),
    EXCUSED: t('parent.attendance.statusExcused'),
    NOT_MARKED: t('parent.attendance.statusNotMarked'),
  };

  return (
    <View style={styles.container}>
      {/* Left: status icon */}
      <Text style={styles.statusIcon}>{STATUS_ICON[status]}</Text>

      {/* Center: date + excuse note */}
      <View style={styles.content}>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.time}>{time}</Text>
        {status === 'EXCUSED' && excuseNote && (
          <Text style={styles.excuseNote}>
            {excuseNote}
          </Text>
        )}
      </View>

      {/* Right: status badge */}
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.badgeText, { color: STATUS_COLOR[status] }]}>
          {statusLabelMap[status]}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusIcon: {
    fontSize: 20,
    marginEnd: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  date: {
    fontSize: 14,
    color: '#374151',
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  excuseNote: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
