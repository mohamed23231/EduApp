/**
 * PerformanceStats — attendance breakdown + rating trend + per-subject rows.
 */

import type { OrgStudentStats } from '../../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { ActivityIndicator, Text } from '@/components/ui';
import colors from '@/components/ui/colors';

const RANGE_OPTIONS = ['week', 'month', 'term'] as const;
type Range = (typeof RANGE_OPTIONS)[number];

type PerformanceStatsProps = {
  range: Range;
  onRangeChange: (r: Range) => void;
  isLoading: boolean;
  isError: boolean;
  stats: OrgStudentStats | undefined;
};

function SubjectRow({ subject }: { subject: OrgStudentStats['subjects'][number] }) {
  const { t } = useTranslation();
  const rating = subject.averageRating > 0 ? subject.averageRating.toFixed(1) : '—';
  return (
    <View className="flex-row items-center gap-3 rounded-2xl p-3.5" style={{ backgroundColor: colors.neutral.card, borderWidth: 1, borderColor: colors.neutral.rule }}>
      <View className="size-9 items-center justify-center rounded-xl" style={{ backgroundColor: colors.semantic.infoSoft }}>
        <Ionicons name="book-outline" size={16} color={colors.semantic.info} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.neutral.ink }}>{subject.subject}</Text>
        <Text style={{ fontSize: 12, color: colors.neutral.inkMuted }}>{subject.teacherName}</Text>
      </View>
      <View className="items-end gap-1">
        <View className="flex-row items-center gap-1">
          <Ionicons name="checkmark-circle-outline" size={12} color={colors.semantic.present} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral.inkMuted }}>
            {t('manager.studentDetail.attended', { count: subject.sessionsAttended, defaultValue: '{{count}} attended' })}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Ionicons name="star-outline" size={12} color={colors.semantic.excused} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral.inkMuted }}>{rating}</Text>
        </View>
      </View>
    </View>
  );
}

export function PerformanceStats({ range, onRangeChange, isLoading, isError, stats }: PerformanceStatsProps) {
  const { t } = useTranslation();
  const c = colors;

  return (
    <View className="px-4">
      {/* Range pills row */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text style={{ fontSize: 10, fontWeight: '700', color: c.neutral.inkMuted, textTransform: 'uppercase', letterSpacing: 1.5 }}>
          {t('manager.studentDetail.performance', { defaultValue: 'Performance' })}
        </Text>
        <View className="flex-row gap-1">
          {RANGE_OPTIONS.map(r => (
            <Pressable
              key={r}
              onPress={() => onRangeChange(r)}
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: range === r ? c.neutral.ink : c.neutral.cardWarm }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: range === r ? '#fff' : c.neutral.inkMuted }}>
                {t(`manager.reports.range.${r}`, { defaultValue: r })}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {isLoading
        ? (
            <View className="items-center py-6">
              <ActivityIndicator size="small" />
            </View>
          )
        : isError
          ? (
              <View className="items-center py-4">
                <Text style={{ fontSize: 13, color: c.semantic.absent }}>
                  {t('manager.studentDetail.statsError', { defaultValue: 'Could not load stats.' })}
                </Text>
              </View>
            )
          : stats
            ? (
                <View className="gap-3">
                  {/* Attendance breakdown */}
                  <View className="flex-row gap-1.5">
                    {[
                      { key: 'present', value: stats.present, soft: c.semantic.presentSoft, ink: c.semantic.presentInk },
                      { key: 'absent', value: stats.absent, soft: c.semantic.absentSoft, ink: c.semantic.absentInk },
                      { key: 'excused', value: stats.excused, soft: c.semantic.excusedSoft, ink: c.semantic.excusedInk },
                    ].map(item => (
                      <View key={item.key} className="flex-1 items-center rounded-2xl py-3" style={{ backgroundColor: item.soft }}>
                        <Text style={{ fontSize: 22, fontWeight: '800', color: item.ink, letterSpacing: -0.5 }}>{item.value}</Text>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: item.ink, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 }}>
                          {t(`manager.studentDetail.${item.key}`, { defaultValue: item.key })}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Per-subject rows */}
                  {stats.subjects.length > 0 && (
                    <>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: c.neutral.inkMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 }}>
                        {t('manager.studentDetail.bySubject', { defaultValue: 'By subject' })}
                      </Text>
                      <View className="gap-2">
                        {stats.subjects.map(sub => (
                          <SubjectRow key={sub.subject} subject={sub} />
                        ))}
                      </View>
                    </>
                  )}
                </View>
              )
            : null}
    </View>
  );
}
