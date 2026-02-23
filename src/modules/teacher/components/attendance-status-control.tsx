/**
 * AttendanceStatusControl component
 * Three-way toggle for attendance status with excuse note input
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 7.2, 7.3, 9.2, 14.1, 15.1, 15.5
 */

import type { AttendanceStatus } from '../types';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Input, Text } from '@/components/ui';

type AttendanceStatusControlProps = {
  student: { id: string; name: string };
  status: AttendanceStatus | null;
  excuseNote: string;
  onStatusChange: (status: AttendanceStatus) => void;
  onExcuseNoteChange: (note: string) => void;
  disabled: boolean;
};

export function AttendanceStatusControl({
  student,
  status,
  excuseNote,
  onStatusChange,
  onExcuseNoteChange,
  disabled,
}: AttendanceStatusControlProps) {
  const { t } = useTranslation();

  const handleStatusPress = (newStatus: AttendanceStatus) => {
    if (!disabled) {
      onStatusChange(newStatus);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.studentName}>{student.name}</Text>

      <View style={styles.statusButtons}>
        <TouchableOpacity
          style={[
            styles.statusButton,
            status === 'PRESENT' && styles.statusButtonActive,
            status === 'PRESENT' && styles.statusButtonPresent,
            disabled && styles.statusButtonDisabled,
          ]}
          onPress={() => handleStatusPress('PRESENT')}
          disabled={disabled}
        >
          <Text
            style={[
              styles.statusButtonText,
              status === 'PRESENT' && styles.statusButtonTextActive,
            ]}
          >
            {t('teacher.attendance.present')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statusButton,
            status === 'ABSENT' && styles.statusButtonActive,
            status === 'ABSENT' && styles.statusButtonAbsent,
            disabled && styles.statusButtonDisabled,
          ]}
          onPress={() => handleStatusPress('ABSENT')}
          disabled={disabled}
        >
          <Text
            style={[
              styles.statusButtonText,
              status === 'ABSENT' && styles.statusButtonTextActive,
            ]}
          >
            {t('teacher.attendance.absent')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statusButton,
            status === 'EXCUSED' && styles.statusButtonActive,
            status === 'EXCUSED' && styles.statusButtonExcused,
            disabled && styles.statusButtonDisabled,
          ]}
          onPress={() => handleStatusPress('EXCUSED')}
          disabled={disabled}
        >
          <Text
            style={[
              styles.statusButtonText,
              status === 'EXCUSED' && styles.statusButtonTextActive,
            ]}
          >
            {t('teacher.attendance.excused')}
          </Text>
        </TouchableOpacity>
      </View>

      {status === 'EXCUSED' && (
        <Input
          placeholder={t('teacher.attendance.excuseNotePlaceholder')}
          value={excuseNote}
          onChangeText={onExcuseNoteChange}
          disabled={disabled}
          multiline
          numberOfLines={2}
          style={styles.excuseNoteInput}
        />
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
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  statusButtonActive: {
    borderWidth: 0,
  },
  statusButtonPresent: {
    backgroundColor: '#D1FAE5',
  },
  statusButtonAbsent: {
    backgroundColor: '#FEE2E2',
  },
  statusButtonExcused: {
    backgroundColor: '#FEF3C7',
  },
  statusButtonDisabled: {
    opacity: 0.5,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusButtonTextActive: {
    color: '#111827',
  },
  excuseNoteInput: {
    marginTop: 12,
  },
});
