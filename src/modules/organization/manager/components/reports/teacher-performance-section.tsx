import type { OrgTeacherStatsItem } from '../../types/manager.types';
import { useTranslation } from 'react-i18next';
import { Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';

type TeacherPerformanceSectionProps = {
  teachers: OrgTeacherStatsItem[];
};

export function TeacherPerformanceSection({ teachers }: TeacherPerformanceSectionProps) {
  const { t } = useTranslation();
  return (
    <View className="mt-5 rounded-[28px] p-5" style={{ backgroundColor: colors.neutral.card }}>
      <Text className="text-lg font-semibold" style={{ color: colors.neutral.ink }}>
        {t('manager.reports.teacherPerformance', { defaultValue: 'Teacher performance' })}
      </Text>
      <View className="mt-4 gap-3">
        {teachers.map(teacher => (
          <View
            key={teacher.memberId}
            className="rounded-2xl border p-4"
            style={{ borderColor: colors.neutral.rule }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.neutral.ink }}>
              {teacher.name}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 14, color: colors.neutral.inkMuted }}>
              {t('manager.reports.teacherSummary', {
                defaultValue: '{{completed}} completed • {{attendance}}% attendance',
                completed: teacher.completedSessions,
                attendance: teacher.averageAttendanceRate,
              })}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 14, color: colors.neutral.inkMuted }}>
              {t('manager.reports.teacherRating', { defaultValue: 'Rating: {{rating}}', rating: teacher.averageRating })}
              {' • '}
              {t('manager.reports.teacherLastSession', { defaultValue: 'Last session: {{date}}', date: teacher.lastSessionDate })}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
