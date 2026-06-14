/**
 * StudentHero — dark card for ManagerStudentDetail.
 * Shows status pill (AT RISK / ON TRACK), monogram, name/grade/subjects,
 * and 3-stat strip (attendance, avg rating, trend).
 */

import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Dot, Monogram, Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type StudentHeroProps = {
  name: string;
  gradeLevel?: string;
  subjectCount?: number;
  parentName?: string;
  parentRelationship?: string;
  attendanceRate: number;
  averageRating: number;
  ratingDelta?: number;
  atRisk: boolean;
  tone?: 'indigo' | 'rose' | 'teal' | 'amber' | 'violet' | 'sky' | 'lime' | 'present' | 'absent' | 'excused' | 'ink';
};

export function StudentHero({
  name,
  gradeLevel,
  subjectCount,
  parentName,
  parentRelationship,
  attendanceRate,
  averageRating,
  ratingDelta = 0,
  atRisk,
  tone = 'sky',
}: StudentHeroProps) {
  const { t } = useTranslation();
  const c = colors;
  const trendUp = ratingDelta >= 0;
  const attColor = attendanceRate >= 85 ? c.brand.primary : c.semantic.absent;
  const ratingColor = averageRating >= 7 ? '#fff' : c.semantic.absent;
  const trendColor = trendUp ? c.brand.primary : c.semantic.absent;
  const glowColor = atRisk ? c.semantic.absent : c.brand.primary;

  const metaParts = [
    gradeLevel,
    subjectCount ? t('manager.studentDetail.subjectCount', { count: subjectCount, defaultValue: '{{count}} subjects' }) : undefined,
    parentName ? `${parentRelationship ?? ''} ${parentName}`.trim() : undefined,
  ].filter(Boolean).join(' · ');

  const stats = [
    { label: t('manager.studentDetail.attendanceRate', { defaultValue: 'Attendance' }), value: `${Math.round(attendanceRate)}%`, color: attColor },
    { label: t('manager.studentDetail.avgRating', { defaultValue: 'Avg rating' }), value: averageRating > 0 ? averageRating.toFixed(1) : '—', suffix: averageRating > 0 ? '/10' : undefined, color: ratingColor },
    { label: t('manager.studentDetail.trend5', { defaultValue: 'Trend (5)' }), value: `${trendUp ? '+' : ''}${ratingDelta.toFixed(1)}`, color: trendColor, glyph: trendUp ? '↗' : '↘' },
  ];

  return (
    <View className="mx-4 mb-4 overflow-hidden rounded-[22px] p-5" style={{ backgroundColor: c.neutral.ink }}>
      {/* Glow */}
      <View style={{ position: 'absolute', top: -50, end: -50, width: 200, height: 200, borderRadius: 999, backgroundColor: glowColor, opacity: 0.28 }} />

      {/* Status pill */}
      <View className="flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)' }}>
        <Dot size={5} color={atRisk ? c.semantic.absent : c.brand.primary} pulse={atRisk} />
        <Text style={{ fontSize: 9, letterSpacing: 1.5, fontWeight: '800', color: atRisk ? c.semantic.absent : c.brand.primary }}>
          {atRisk
            ? t('manager.studentDetail.atRisk', { defaultValue: 'AT RISK' })
            : t('manager.studentDetail.onTrack', { defaultValue: 'ON TRACK' })}
        </Text>
      </View>

      {/* Identity */}
      <View className="mt-3.5 flex-row items-center gap-4">
        <Monogram name={name} tone={tone} size={64} />
        <View className="flex-1">
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5, lineHeight: 26 }}>{name}</Text>
          {metaParts
            ? (
                <Text style={{ fontSize: 13, color: c.neutral.dim, fontWeight: '500', marginTop: 4 }}>{metaParts}</Text>
              )
            : null}
        </View>
      </View>

      {/* 3-stat strip */}
      <View className="mt-4 flex-row gap-2">
        {stats.map(stat => (
          <View
            key={stat.label}
            className="flex-1 rounded-2xl p-3"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)' }}
          >
            <Text style={{ fontSize: 9, letterSpacing: 1.2, color: c.neutral.dim, textTransform: 'uppercase', fontWeight: '700' }}>{stat.label}</Text>
            <View className="mt-1.5 flex-row items-baseline gap-0.5">
              <Text style={{ fontSize: 22, fontWeight: '800', color: stat.color, letterSpacing: -0.5 }}>{stat.value}</Text>
              {stat.suffix ? <Text style={{ fontSize: 11, color: c.neutral.dim, fontWeight: '600' }}>{stat.suffix}</Text> : null}
              {stat.glyph ? <Text style={{ fontSize: 14, color: stat.color, fontWeight: '800', marginStart: 'auto' }}>{stat.glyph}</Text> : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
