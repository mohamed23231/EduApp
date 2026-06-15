import type { TimelineRecord } from '../types';
import type { SupportedLocale } from '@/lib/date';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ErrorState, Icon, PressButton, SectionLabel, Skeleton } from '@/components/ui';
import colors from '@/components/ui/colors';
import { useFeatureFlags } from '@/core/feature-flags/use-feature-flags';
import { AppRoute } from '@/core/navigation/routes';
import { TimelineRow } from '../components/dashboard';
import { StudentHero, UnlinkedBanner } from '../components/student';
import { useAttendanceStats, useAttendanceTimeline, useStudentDetails } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';

/**
 * Parent · Student Detail — dark hero (Monogram + 3-stat strip),
 * RECENT timeline (3 reused activity cards), and CTAs to attendance + performance.
 * Mirrors `screens-parent.jsx` § PARENT · STUDENT DETAIL, scoped to data the BE
 * already exposes today (attendance stats + timeline + student details).
 */

function AccessCodeRow({ code }: { code: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
      <SectionLabel>{t('parent.studentDetails.accessCodeLabel', 'ACCESS CODE')}</SectionLabel>
      <View
        style={{
          marginTop: 8,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.neutral.card,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.neutral.rule,
          paddingHorizontal: 16,
          paddingVertical: 14,
          gap: 12,
        }}
      >
        <Text
          style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.neutral.ink, letterSpacing: 2 }}
          accessibilityLabel={code}
        >
          {code}
        </Text>
        <Pressable
          onPress={handleCopy}
          accessibilityRole="button"
          accessibilityLabel={t('parent.studentDetails.accessCodeCopy', 'Copy')}
          style={({ pressed }) => ({
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 10,
            backgroundColor: pressed ? colors.neutral.cardWarm : colors.neutral.paper,
            borderWidth: 1,
            borderColor: colors.neutral.rule,
          })}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: copied ? colors.semantic.present : colors.neutral.ink }}>
            {copied
              ? t('parent.studentDetails.accessCodeCopied', 'Copied!')
              : t('parent.studentDetails.accessCodeCopy', 'Copy')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// eslint-disable-next-line max-lines-per-function
export function StudentDetailsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isRTL = i18n?.language === 'ar';
  const locale: SupportedLocale = isRTL ? 'ar' : 'en';

  const { data: student, isLoading, error, refetch } = useStudentDetails(id || '');
  const { data: stats } = useAttendanceStats(id || '');
  const { data: timeline } = useAttendanceTimeline(id || '', 1, 5);
  const { isParentPerformanceEnabled } = useFeatureFlags();

  if (!id || (!isLoading && !student && !error)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.neutral.paper }}>
        <ErrorState
          title={t('parent.studentDetails.errorTitle', 'Could not load this student')}
          body={t('parent.common.genericError')}
          action={{ label: t('parent.common.back', 'Back'), onPress: () => router.back() }}
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.neutral.paper }} testID="loading-indicator">
        <StudentDetailsSkeleton />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.neutral.paper }}>
        <ErrorState
          title={t('parent.studentDetails.errorTitle', 'Could not load this student')}
          body={extractErrorMessage(error, t)}
          action={{ label: t('parent.common.retry', 'Retry'), onPress: () => refetch() }}
          testID="retry-button"
        />
      </View>
    );
  }

  if (!student)
    return null;

  const isUnlinked = student.linkStatus === 'unlinked';

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <StudentHero
          student={student}
          stats={stats}
          onBack={() => router.back()}
          isRTL={isRTL}
          t={t}
        />

        {isUnlinked
          ? <UnlinkedBanner studentName={student.fullName} isRTL={isRTL} t={t} />
          : null}

        {!isUnlinked && student.connectionCode
          ? <AccessCodeRow code={student.connectionCode} />
          : null}

        {timeline && timeline.length > 0
          ? (
              <>
                <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                  <SectionLabel>{t('parent.studentDetails.recentLabel', 'RECENT')}</SectionLabel>
                </View>
                <View style={{ marginHorizontal: 16, marginTop: 8, gap: 8 }}>
                  {timeline.slice(0, 3).map((record: TimelineRecord, idx: number, arr: TimelineRecord[]) => (
                    <TimelineRow
                      key={`${record.date}-${record.time}-${record.status}`}
                      record={record}
                      isLast={idx === arr.length - 1}
                      isRTL={isRTL}
                      locale={locale}
                      studentName={student.fullName}
                      studentId={student.id}
                      t={t}
                    />
                  ))}
                </View>
              </>
            )
          : null}

        <View style={{ paddingHorizontal: 16, marginTop: 24, gap: 10 }}>
          <PressButton
            variant="gradient"
            size="md"
            fullWidth
            onPress={() => router.push(AppRoute.parent.studentAttendance(id))}
            label={t('parent.studentDetails.viewAttendance')}
            trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.white} />}
            testID="view-attendance-button"
          />
          {isParentPerformanceEnabled
            ? (
                <PressButton
                  variant="ghost"
                  size="md"
                  fullWidth
                  onPress={() => router.push(AppRoute.parent.studentPerformance(id))}
                  label={t('parent.studentDetails.viewPerformance', 'View performance')}
                  trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.ink} />}
                />
              )
            : null}
        </View>
      </ScrollView>
    </View>
  );
}

function StudentDetailsSkeleton() {
  return (
    <View>
      <View
        style={{
          backgroundColor: colors.neutral.ink,
          paddingHorizontal: 20,
          paddingTop: 56,
          paddingBottom: 28,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          gap: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Skeleton width={72} height={72} radius={36} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="60%" height={20} />
            <Skeleton width="40%" height={13} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[0, 1, 2].map(i => <Skeleton key={i} width={90} height={56} radius={16} />)}
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, marginTop: 24, gap: 12 }}>
        <Skeleton width="35%" height={14} />
        <Skeleton width="100%" height={56} radius={14} />
        <Skeleton width="100%" height={56} radius={14} />
      </View>
    </View>
  );
}
