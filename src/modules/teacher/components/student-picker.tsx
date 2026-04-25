/**
 * StudentPicker component
 * Multi-select student list for session template assignment
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 7.2, 7.3, 9.2, 14.1, 15.1, 15.5
 */

import type { Student } from '../types';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Checkbox, Text } from '@/components/ui';

type StudentPickerProps = {
  availableStudents: Student[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
};

export function StudentPicker({ availableStudents, selectedIds, onSelectionChange }: StudentPickerProps) {
  const { t } = useTranslation();

  const allSelected = availableStudents.length > 0
    && availableStudents.every(s => selectedIds.includes(s.id));

  const handleToggle = (studentId: string) => {
    const newSelectedIds = selectedIds.includes(studentId)
      ? selectedIds.filter(id => id !== studentId)
      : [...selectedIds, studentId];
    onSelectionChange(newSelectedIds);
  };

  const handleToggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    }
    else {
      onSelectionChange(availableStudents.map(s => s.id));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('teacher.sessions.selectStudents')}</Text>
        {availableStudents.length > 0 && (
          <TouchableOpacity onPress={handleToggleAll} activeOpacity={0.7}>
            <Text style={styles.selectAllText}>
              {allSelected
                ? t('teacher.sessions.deselectAll')
                : t('teacher.sessions.selectAll')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {availableStudents.length === 0
        ? (
            <Text style={styles.emptyText}>{t('teacher.sessions.noStudentsAvailable')}</Text>
          )
        : (
            availableStudents.map(student => (
              <TouchableOpacity
                key={student.id}
                style={styles.studentItem}
                onPress={() => handleToggle(student.id)}
                activeOpacity={0.7}
              >
                <Checkbox
                  checked={selectedIds.includes(student.id)}
                  onChange={() => handleToggle(student.id)}
                  accessibilityLabel={`Select ${student.name}`}
                />
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  {student.gradeLevel && (
                    <Text style={styles.studentGrade}>{student.gradeLevel}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
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
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 16,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  studentInfo: {
    flex: 1,
    marginStart: 12,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  studentGrade: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});
