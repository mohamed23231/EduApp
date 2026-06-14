import type { AttendanceStatus, Student } from '../../types';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { AttendanceStatusControl } from '../attendance-status-control';

type AttendanceEntry = {
  status: AttendanceStatus | null;
  excuseNote: string;
  rating: number | null;
};

type AttendanceStudentListProps = {
  students: Student[];
  attendanceMap: Record<string, AttendanceEntry>;
  disabled: boolean;
  onStatusChange: (studentId: string) => (status: AttendanceStatus) => void;
  onExcuseNoteChange: (studentId: string) => (note: string) => void;
  onRatingChange: (studentId: string) => (rating: number | null) => void;
};

export function AttendanceStudentList({
  students,
  attendanceMap,
  disabled,
  onStatusChange,
  onExcuseNoteChange,
  onRatingChange,
}: AttendanceStudentListProps) {
  const { t } = useTranslation();

  if (students.length === 0) {
    return (
      <View className="items-center py-10">
        <Text className="text-body-lg" style={{ color: colors.text.tertiary }}>{t('teacher.attendance.noSearchResults')}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-3 px-5 py-4">
      {students.map((student) => {
        const attendance = attendanceMap[student.id];
        return (
          <AttendanceStatusControl
            key={student.id}
            student={student}
            status={attendance?.status || null}
            excuseNote={attendance?.excuseNote || ''}
            rating={attendance?.rating ?? null}
            onStatusChange={onStatusChange(student.id)}
            onExcuseNoteChange={onExcuseNoteChange(student.id)}
            onRatingChange={onRatingChange(student.id)}
            disabled={disabled}
          />
        );
      })}
    </ScrollView>
  );
}
