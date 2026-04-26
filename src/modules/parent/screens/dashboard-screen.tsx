import type { Student, TimelineRecord } from '../types';
import type { SupportedLocale } from '@/lib/date';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BigNumber,
  Dot,
  Hairline,
  Icon,
  Monogram,
  PressButton,
  SectionLabel,
  StatusChip,
  TabaMark,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { AppRoute } from '@/core/navigation/routes';
import { formatCalendarDay, formatTime } from '@/lib/date';
import { EmptyDashboard, NotificationBell } from '../components';
import { useChildSummaryHero } from '../hooks';
import { useStudents } from '../hooks/use-students';
import { extractErrorMessage } from '../services/error-utils';
import { useNotificationStore } from '../store/use-notification-store';

/**
 * ParentDashboardScreen — Phase 8 rebuild against `contracts/visual-parent.md`.
 *
 * Macro: paper canvas, ink hero, hairline-divided rows. The hero holds the
 * single sentence the parent opened the app to read ("Layla was in class
 * today"). All data comes from useChildSummaryHero — no fabricated live or
 * next-session fields.
 */

type StatusKey = 'present' | 'absent' | 'excused' | 'none';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function deriveStatusKey(status: string): StatusKey {
  if (status === 'PRESENT')
    return 'present';
  if (status === 'ABSENT')
    return 'absent';
  if (status === 'EXCUSED')
    return 'excused';
  return 'none';
}

function deriveTodayRecord(timeline: TimelineRecord[]): TimelineRecord | null {
  if (!timeline.length)
    return null;
  const today = todayKey();
  return timeline.find(r => r.date.slice(0, 10) === today) ?? timeline[0];
}

/**
 * Backend returns `date` as ISO timestamp (e.g. `2026-03-06T00:00:00.000Z`)
 * and `time` as a separate `HH:MM:SS` string. Combine them into a single
 * Date-parseable input that dayjs can format with the active locale.
 */
function combineDateTime(date: string, time: string): string {
  const datePart = date.includes('T') ? date.slice(0, 10) : date;
  const timePart = time.length === 5 ? `${time}:00` : time;
  return `${datePart}T${timePart}`;
}

type HeroProps = {
  studentFirstName: string;
  todayRecord: TimelineRecord | null;
  attendanceRate: number | undefined;
  isRTL: boolean;
  locale: SupportedLocale;
  t: (key: string, opts?: any) => string;
};

// eslint-disable-next-line max-lines-per-function
function ParentHero({ studentFirstName, todayRecord, attendanceRate, isRTL, locale, t }: HeroProps) {
  const status: StatusKey = todayRecord ? deriveStatusKey(todayRecord.status) : 'none';

  const STATUS_DOT: Record<StatusKey, string> = {
    present: colors.semantic.present,
    absent: colors.semantic.absent,
    excused: colors.semantic.excused,
    none: colors.neutral.dim,
  };
  const STATUS_TAG_COLOR: Record<StatusKey, string> = {
    present: colors.brand.primary,
    absent: colors.semantic.absent,
    excused: colors.semantic.excused,
    none: colors.neutral.dim,
  };
  const STATUS_TAG_KEY: Record<StatusKey, [string, string]> = {
    present: ['parent.dashboard.hero.tagPresent', 'IN CLASS TODAY'],
    absent: ['parent.dashboard.hero.tagAbsent', 'NOT IN CLASS'],
    excused: ['parent.dashboard.hero.tagExcused', 'EXCUSED TODAY'],
    none: ['parent.dashboard.hero.tagNone', 'NO SESSIONS YET'],
  };
  const STATUS_HEADLINE_KEY: Record<StatusKey, [string, string]> = {
    present: ['parent.dashboard.hero.headlinePresent', '{{name}} was in class today.'],
    absent: ['parent.dashboard.hero.headlineAbsent', '{{name}} was absent today.'],
    excused: ['parent.dashboard.hero.headlineExcused', '{{name}} was excused today.'],
    none: ['parent.dashboard.hero.headlineNone', '{{name}} has no sessions yet.'],
  };

  const dotColor = STATUS_DOT[status];
  const tagColor = STATUS_TAG_COLOR[status];
  const [tagKey, tagFallback] = STATUS_TAG_KEY[status];
  const tagText = t(tagKey, { defaultValue: tagFallback });
  const [headlineKey, headlineFallback] = STATUS_HEADLINE_KEY[status];
  const headlineText = t(headlineKey, { defaultValue: headlineFallback, name: studentFirstName });

  const subText = todayRecord
    ? `${formatCalendarDay(todayRecord.date, locale)} · ${formatTime(combineDateTime(todayRecord.date, todayRecord.time), locale)}`
    : t('parent.dashboard.hero.subNone', { defaultValue: 'Stats appear once their first session lands.' });

  const hasRate = typeof attendanceRate === 'number' && !Number.isNaN(attendanceRate);

  return (
    <View
      style={{
        marginHorizontal: 16,
        backgroundColor: colors.neutral.ink,
        borderRadius: 24,
        padding: 22,
        position: 'relative',
        overflow: 'hidden',
      }}
      testID="parent-hero"
    >
      {/* Brand-green glow accent */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -40,
          end: -40,
          width: 180,
          height: 180,
          borderRadius: 999,
          backgroundColor: colors.brand.primary,
          opacity: 0.18,
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Dot size={8} color={dotColor} pulse={status === 'present'} />
        <Text
          style={{
            color: tagColor,
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1.5,
          }}
        >
          {tagText}
        </Text>
      </View>
      <Text
        style={{
          color: colors.neutral.white,
          fontSize: 28,
          fontWeight: '700',
          letterSpacing: -1,
          lineHeight: 32,
          textAlign: isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        }}
      >
        {headlineText}
      </Text>
      <Text
        style={{
          color: colors.neutral.dim,
          fontSize: 14,
          fontWeight: '500',
          marginTop: 8,
          textAlign: isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        }}
      >
        {subText}
      </Text>

      {hasRate
        ? (
            <View
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: 'rgba(255,255,255,0.10)',
                flexDirection: 'row',
                alignItems: 'baseline',
                gap: 10,
              }}
            >
              <BigNumber
                value={Math.round(attendanceRate as number)}
                suffix="%"
                size={44}
                weight={700}
                color={colors.neutral.white}
              />
              <Text
                style={{
                  color: colors.neutral.dim,
                  fontSize: 13,
                  fontWeight: '600',
                  letterSpacing: 0.3,
                }}
              >
                {t('parent.dashboard.hero.rateLabel', 'attendance · last 30 days')}
              </Text>
            </View>
          )
        : null}
    </View>
  );
}

type SwitcherProps = {
  students: Student[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: () => void;
};

function ChildSwitcher({ students, selectedId, onSelect, onAddChild }: SwitcherProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 4 }}
    >
      {students.map((student) => {
        const isSelected = student.id === selectedId;
        return (
          <Pressable
            key={student.id}
            onPress={() => onSelect(student.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            testID={`child-pill-${student.id}`}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingStart: 6,
              paddingEnd: 14,
              paddingVertical: 6,
              borderRadius: 999,
              backgroundColor: isSelected
                ? colors.neutral.ink
                : pressed
                  ? colors.neutral.cardWarm
                  : colors.neutral.card,
              borderWidth: 1.5,
              borderColor: isSelected ? colors.neutral.ink : colors.neutral.rule,
            })}
          >
            <Monogram name={student.fullName} size={32} ring={isSelected} />
            <Text
              style={{
                color: isSelected ? colors.neutral.white : colors.neutral.ink,
                fontSize: 13,
                fontWeight: '700',
                letterSpacing: -0.1,
              }}
              numberOfLines={1}
            >
              {student.fullName.split(' ')[0]}
            </Text>
          </Pressable>
        );
      })}
      <Pressable
        onPress={onAddChild}
        accessibilityRole="button"
        testID="add-child-button"
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? colors.neutral.cardWarm : colors.neutral.card,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: colors.neutral.rule,
        })}
      >
        <Icon name="plus" size={16} color={colors.neutral.inkMuted} />
      </Pressable>
    </ScrollView>
  );
}

type TimelineRowProps = {
  record: TimelineRecord;
  isLast: boolean;
  isRTL: boolean;
  locale: SupportedLocale;
};

function TimelineRow({ record, isLast, isRTL, locale }: TimelineRowProps) {
  const status = deriveStatusKey(record.status);
  const chipStatus = status === 'none' ? 'pending' : status;
  const dayLabel = formatCalendarDay(record.date, locale);
  const timeLabel = formatTime(combineDateTime(record.date, record.time), locale);
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 14,
          paddingHorizontal: 4,
        }}
      >
        <View style={{ width: 72 }}>
          <Text
            style={{
              color: colors.neutral.ink,
              fontSize: 13,
              fontWeight: '700',
              letterSpacing: 0.2,
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {timeLabel}
          </Text>
          <Text
            style={{
              color: colors.neutral.inkMuted,
              fontSize: 11,
              fontWeight: '500',
              marginTop: 2,
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={1}
          >
            {dayLabel}
          </Text>
        </View>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <StatusChip status={chipStatus} />
          {record.excuseNote
            ? (
                <Text
                  style={{
                    flex: 1,
                    color: colors.neutral.inkMuted,
                    fontSize: 12,
                    fontWeight: '500',
                    textAlign: isRTL ? 'right' : 'left',
                  }}
                  numberOfLines={2}
                >
                  {record.excuseNote}
                </Text>
              )
            : null}
        </View>
      </View>
      {!isLast ? <Hairline color={colors.neutral.rule} /> : null}
    </View>
  );
}

// eslint-disable-next-line max-lines-per-function
export function ParentDashboardScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = i18n?.language === 'ar';
  const locale: SupportedLocale = isRTL ? 'ar' : 'en';

  const {
    data: students,
    isLoading: studentsLoading,
    error: studentsError,
    refetch: refetchStudents,
  } = useStudents();
  const unreadCount = useNotificationStore.use.unreadCount();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const effectiveSelectedId = useMemo(() => {
    if (!students?.length)
      return null;
    if (selectedStudentId && students.some(s => s.id === selectedStudentId))
      return selectedStudentId;
    return students[0].id;
  }, [students, selectedStudentId]);

  const {
    student: selectedStudent,
    attendanceStats,
    recentTimeline,
    isLoading: heroLoading,
    error: heroError,
  } = useChildSummaryHero(effectiveSelectedId ?? '');

  if (studentsLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.neutral.paper, paddingTop: insets.top }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} testID="loading-indicator">
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      </View>
    );
  }

  if (studentsError) {
    const errorMessage = extractErrorMessage(studentsError, t);
    return (
      <View style={{ flex: 1, backgroundColor: colors.neutral.paper, paddingTop: insets.top }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 }}>
          <Text style={{ color: colors.semantic.absent, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>
            {errorMessage}
          </Text>
          <PressButton
            variant="gradient"
            size="md"
            onPress={() => refetchStudents()}
            label={t('parent.common.retry')}
            testID="retry-button"
          />
        </View>
      </View>
    );
  }

  if (!students?.length) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.neutral.paper, paddingTop: insets.top }}>
        <EmptyDashboard onLinkStudent={() => router.push(AppRoute.parent.linkStudent)} />
      </View>
    );
  }

  const studentFirstName = selectedStudent?.fullName?.split(' ')[0] ?? '';
  const todayRecord = deriveTodayRecord(recentTimeline);

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TabaMark size={36} frame="ink" />
            <View>
              <Text
                style={{
                  color: colors.neutral.inkMuted,
                  fontSize: 12,
                  fontWeight: '600',
                  letterSpacing: 0.2,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {t('parent.dashboard.greeting', 'Hi there')}
              </Text>
              <Text
                style={{
                  color: colors.neutral.ink,
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.4,
                  marginTop: 1,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {t('parent.dashboard.familyLabel', 'Family')}
              </Text>
            </View>
          </View>
          <NotificationBell
            unreadCount={unreadCount}
            onPress={() => router.push(AppRoute.parent.notifications)}
          />
        </View>

        {/* Child switcher */}
        <View style={{ marginBottom: 14 }}>
          <ChildSwitcher
            students={students}
            selectedId={effectiveSelectedId}
            onSelect={setSelectedStudentId}
            onAddChild={() => router.push(AppRoute.parent.linkStudent)}
          />
        </View>

        {/* Hero */}
        {heroLoading && !selectedStudent
          ? (
              <View style={{ marginHorizontal: 16, padding: 22, borderRadius: 24, backgroundColor: colors.neutral.ink, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.brand.primary} />
              </View>
            )
          : (
              <ParentHero
                studentFirstName={studentFirstName}
                todayRecord={todayRecord}
                attendanceRate={attendanceStats?.attendanceRate}
                isRTL={isRTL}
                locale={locale}
                t={t}
              />
            )}

        {heroError
          ? (
              <Text
                style={{
                  marginHorizontal: 16,
                  marginTop: 10,
                  color: colors.semantic.absent,
                  fontSize: 13,
                  fontWeight: '600',
                  textAlign: 'center',
                }}
                testID="hero-error"
              >
                {t('parent.dashboard.statsError')}
              </Text>
            )
          : null}

        {/* Recent timeline */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <SectionLabel>{t('parent.dashboard.timelineSectionLabel', 'RECENT')}</SectionLabel>
        </View>

        <View style={{ marginHorizontal: 16, marginTop: 8 }}>
          {recentTimeline.length === 0
            ? (
                <Text
                  style={{
                    color: colors.neutral.inkMuted,
                    fontSize: 13,
                    fontWeight: '500',
                    textAlign: 'center',
                    paddingVertical: 16,
                  }}
                >
                  {t('parent.dashboard.noTimeline')}
                </Text>
              )
            : (
                <>
                  {recentTimeline.slice(0, 3).map((record: TimelineRecord, idx: number, arr: TimelineRecord[]) => (
                    <TimelineRow
                      key={`${record.date}-${record.time}-${record.status}`}
                      record={record}
                      isLast={idx === arr.length - 1}
                      isRTL={isRTL}
                      locale={locale}
                    />
                  ))}
                </>
              )}
        </View>

        {/* CTAs */}
        {effectiveSelectedId
          ? (
              <View style={{ paddingHorizontal: 16, marginTop: 24, gap: 10 }}>
                <PressButton
                  variant="ghost"
                  size="md"
                  fullWidth
                  onPress={() => router.push(AppRoute.parent.studentPerformance(effectiveSelectedId))}
                  label={t('parent.dashboard.seePerformance', 'View performance & ratings')}
                  trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.ink} />}
                  testID="performance-button"
                />
              </View>
            )
          : null}
      </ScrollView>
    </View>
  );
}
