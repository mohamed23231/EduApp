import type { AttendanceStatus } from '@/modules/parent/types';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { I18nManager, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { Color, withOpacity } from '@/components/ui/color-utils';

const STATUS_ICON: Record<AttendanceStatus, keyof typeof Ionicons.glyphMap> = {
  PRESENT: 'checkmark-circle',
  ABSENT: 'close-circle',
  EXCUSED: 'alert-circle',
  NOT_MARKED: 'remove-circle-outline',
};

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  PRESENT: Color.status.present(),
  ABSENT: Color.status.absent(),
  EXCUSED: Color.status.excused(),
  NOT_MARKED: Color.status.notMarked(),
};

type TimelineItemProps = {
  date: string;
  time: string;
  status: AttendanceStatus;
  excuseNote?: string;
};

function formatDate(raw: string): string {
  try {
    // Handle both ISO timestamps and YYYY-MM-DD
    const d = new Date(raw);
    if (Number.isNaN(d.getTime()))
      return raw;
    const locale = I18nManager.isRTL ? 'ar' : 'en';
    return d.toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }
  catch {
    return raw;
  }
}

function formatTime(raw: string): string {
  try {
    // If it's already HH:mm, parse it
    if (/^\d{1,2}:\d{2}$/.test(raw)) {
      const [h, m] = raw.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      const locale = I18nManager.isRTL ? 'ar' : 'en';
      return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    }
    // If it's HH:mm:ss or ISO, try parsing
    const d = new Date(`1970-01-01T${raw}`);
    if (!Number.isNaN(d.getTime())) {
      const locale = I18nManager.isRTL ? 'ar' : 'en';
      return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    }
    return raw;
  }
  catch {
    return raw;
  }
}

export function TimelineItem({ date, time, status, excuseNote }: TimelineItemProps) {
  const { t } = useTranslation();
  const color = STATUS_COLOR[status];
  const badgeBg = withOpacity(color, 0.1);
  const statusLabelMap: Record<AttendanceStatus, string> = {
    PRESENT: t('parent.attendance.statusPresent'),
    ABSENT: t('parent.attendance.statusAbsent'),
    EXCUSED: t('parent.attendance.statusExcused'),
    NOT_MARKED: t('parent.attendance.statusNotMarked'),
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: badgeBg }]}>
        <Ionicons name={STATUS_ICON[status]} size={20} color={color} />
      </View>

      <View style={styles.content}>
        <Text style={styles.date}>{formatDate(date)}</Text>
        <Text style={styles.time}>{formatTime(time)}</Text>
        {status === 'EXCUSED' && excuseNote && (
          <Text style={styles.excuseNote} numberOfLines={2}>{excuseNote}</Text>
        )}
      </View>

      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.badgeText, { color }]}>
          {statusLabelMap[status]}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Color.gray(100),
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    color: Color.gray(700),
  },
  time: {
    fontSize: 12,
    color: Color.gray(400),
    marginTop: 2,
  },
  excuseNote: {
    fontSize: 12,
    color: Color.gray(500),
    marginTop: 3,
    fontStyle: 'italic',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
