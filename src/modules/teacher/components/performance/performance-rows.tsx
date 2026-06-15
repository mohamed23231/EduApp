/**
 * Performance screen rows — summary tiles + per-session record row.
 * Extracted from teacher-student-performance-screen to keep the screen
 * under the 300-line cap and migrate it off StyleSheet.create.
 */

import type { PerformanceRecord } from '@/shared/performance';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StatusChip, Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type SummaryTileProps = {
  label: string;
  value: string;
};

export function SummaryTile({ label, value }: SummaryTileProps) {
  return (
    <View
      className="min-w-[70px] flex-1 items-center rounded-2xl border border-rule p-3"
      style={{ backgroundColor: colors.neutral.card }}
    >
      <Text className="text-title font-bold text-ink">{value}</Text>
      <Text className="mt-0.5 text-center text-caption text-ink-muted">{label}</Text>
    </View>
  );
}

const STATUS_CHIP: Record<PerformanceRecord['status'], 'present' | 'absent' | 'excused'> = {
  PRESENT: 'present',
  ABSENT: 'absent',
  EXCUSED: 'excused',
};

type RecordRowProps = {
  record: PerformanceRecord;
};

export function RecordRow({ record }: RecordRowProps) {
  const { t } = useTranslation();
  return (
    <View
      className="flex-row gap-3 rounded-2xl border border-rule p-3.5"
      style={{ backgroundColor: colors.neutral.card }}
    >
      <View className="flex-1">
        <Text className="text-body font-semibold text-ink-soft">{record.date}</Text>
        <Text className="mt-0.5 text-caption text-ink-muted">{record.sessionSubject}</Text>
        {record.excuseNote
          ? (
              <Text className="mt-0.5 text-caption text-dim italic">{record.excuseNote}</Text>
            )
          : null}
      </View>
      <View className="items-end gap-1.5">
        <StatusChip status={STATUS_CHIP[record.status]} compact />
        <Text className="text-body-lg font-bold text-ink">
          {record.rating !== null
            ? `${record.rating}/10`
            : t('teacher.performance.noRatingLabel', 'Not rated')}
        </Text>
      </View>
    </View>
  );
}
