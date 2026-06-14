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
    <View style={{ marginTop: 20, borderRadius: 28, backgroundColor: colors.neutral.card, padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: colors.neutral.ink }}>
        {t('manager.reports.teacherPerformance', { defaultValue: 'Teacher performance' })}
      </Text>
      <View style={{ marginTop: 16, gap: 12 }}>
        {teachers.map(teacher => (
          <View
            key={teacher.memberId}
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.neutral.rule,
              padding: 16,
            }}
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
