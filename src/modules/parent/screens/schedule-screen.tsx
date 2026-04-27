import type { SupportedLocale } from '@/lib/date';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SectionLabel } from '@/components/ui';
import colors from '@/components/ui/colors';
import { ScheduleRow } from '../components/schedule';
import { useStudents } from '../hooks';

/**
 * Parent Schedule tab — aggregates the next session per linked student.
 * Per `screens-parent.jsx` design (kid switcher + upcoming list pattern,
 * adapted to one row per kid with their next class).
 */
export function ScheduleScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = i18n?.language === 'ar';
  const locale: SupportedLocale = isRTL ? 'ar' : 'en';
  const { data: students, isLoading } = useStudents();

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 }}>
          <Text
            style={{
              color: colors.neutral.inkMuted,
              fontSize: 12,
              fontWeight: '600',
              letterSpacing: 0.2,
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {t('parent.schedule.upcomingLabel', 'UPCOMING')}
          </Text>
          <Text
            style={{
              color: colors.neutral.ink,
              fontSize: 22,
              fontWeight: '700',
              letterSpacing: -0.5,
              marginTop: 2,
              textAlign: isRTL ? 'right' : 'left',
            }}
          >
            {t('parent.schedule.title', 'Schedule')}
          </Text>
        </View>

        {isLoading
          ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={colors.brand.primary} />
              </View>
            )
          : !students || students.length === 0
              ? (
                  <View style={{ paddingHorizontal: 24, paddingVertical: 40, alignItems: 'center' }}>
                    <Text
                      style={{
                        color: colors.neutral.ink,
                        fontSize: 16,
                        fontWeight: '700',
                        textAlign: 'center',
                      }}
                    >
                      {t('parent.schedule.emptyTitle')}
                    </Text>
                    <Text
                      style={{
                        marginTop: 6,
                        color: colors.neutral.inkMuted,
                        fontSize: 13,
                        fontWeight: '500',
                        textAlign: 'center',
                      }}
                    >
                      {t('parent.schedule.emptyMessage')}
                    </Text>
                  </View>
                )
              : (
                  <>
                    <View style={{ paddingHorizontal: 16 }}>
                      <SectionLabel>{t('parent.schedule.upcomingLabel', 'UPCOMING')}</SectionLabel>
                    </View>
                    <View style={{ marginTop: 8 }}>
                      {students.map(student => (
                        <ScheduleRow
                          key={student.id}
                          student={student}
                          locale={locale}
                          isRTL={isRTL}
                          t={t}
                        />
                      ))}
                    </View>
                  </>
                )}
      </ScrollView>
    </View>
  );
}
