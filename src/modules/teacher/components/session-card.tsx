/**
 * SessionCard component
 * Displays a session instance with different states
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 7.2, 7.3, 9.2, 14.1, 15.1, 15.5
 */

import type { SessionInstance } from '../types';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text } from '@/components/ui';

type SessionCardProps = {
  instance: SessionInstance;
  onStartSession: (id: string) => void;
  onMarkAttendance: (id: string) => void;
  isStarting: boolean;
};

export function SessionCard({ instance, onStartSession, onMarkAttendance, isStarting }: SessionCardProps) {
  const { t } = useTranslation();

  const handleStartSession = () => {
    onStartSession(instance.id);
  };

  const handleMarkAttendance = () => {
    onMarkAttendance(instance.id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subject}>{instance.subject}</Text>
        <Text style={styles.time}>{instance.time}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.studentCount}>
          {t('teacher.sessions.studentCount', { count: instance.studentCount })}
        </Text>

        {instance.state === 'DRAFT' && (
          <Button
            label={t('teacher.sessions.startSession')}
            onPress={handleStartSession}
            loading={isStarting}
            variant="default"
            size="sm"
          />
        )}

        {instance.state === 'ACTIVE' && (
          <Button
            label={t('teacher.sessions.markAttendance')}
            onPress={handleMarkAttendance}
            variant="default"
            size="sm"
          />
        )}

        {instance.state === 'CLOSED' && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedBadgeText}>{t('teacher.sessions.closed')}</Text>
          </View>
        )}
      </View>

      {instance.state === 'CLOSED' && instance.attendanceSummary && (
        <View style={styles.attendanceSummary}>
          <Text style={styles.attendanceSummaryText}>
            {t('teacher.sessions.attendanceSummary', {
              present: instance.attendanceSummary.present,
              absent: instance.attendanceSummary.absent,
              excused: instance.attendanceSummary.excused,
            })}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  time: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  closedBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  closedBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  attendanceSummary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attendanceSummaryText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
