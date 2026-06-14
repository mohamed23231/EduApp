/**
 * AttendanceHero — dark obsidian card with lime glow, live attendance %.
 * Tappable; navigates to attendance screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type Props = {
  attendanceRate: number;
  presentCount: number;
  absentCount: number;
  runningNow: number;
  onPress: () => void;
};

export function AttendanceHero({ attendanceRate, presentCount, absentCount, runningNow, onPress }: Props) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('manager.dashboard.hero.a11y', { defaultValue: 'View live attendance' })}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <View
        className="mx-4 mt-3 overflow-hidden rounded-3xl p-6"
        style={{ backgroundColor: colors.neutral.ink }}
      >
        {/* Lime glow blob — decorative, no blurRadius on RN View */}
        <View
          className="absolute size-[200px] rounded-full"
          style={{
            top: -50,
            end: -50,
            backgroundColor: colors.brand.primary,
            opacity: 0.3,
          }}
          pointerEvents="none"
        />

        {/* Label row */}
        <View className="mb-2 flex-row items-center gap-2">
          {/* Static lime dot */}
          <View className="size-2 rounded-full" style={{ backgroundColor: colors.brand.primary }} />
          <Text
            style={{
              color: colors.brand.primary,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              fontFamily: undefined, // system mono fallback
            }}
          >
            {t('manager.dashboard.hero.liveLabel', { defaultValue: 'Live Attendance' })}
          </Text>
        </View>

        {/* Big percentage number */}
        <Text
          style={{
            color: colors.neutral.card,
            fontSize: 64,
            fontWeight: '800',
            letterSpacing: -2,
            lineHeight: 72,
          }}
        >
          {`${Math.round(attendanceRate)}%`}
        </Text>

        {/* Sub-stat line */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <Ionicons name="people-outline" size={13} color={colors.neutral.dim} />
          <Text style={{ color: colors.neutral.dim, fontSize: 13, fontWeight: '500' }}>
            {t('manager.dashboard.hero.subStat', {
              defaultValue: '{{present}} present · {{absent}} absent · {{live}} sessions live',
              present: presentCount,
              absent: absentCount,
              live: runningNow,
            })}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
