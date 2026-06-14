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
        style={{
          backgroundColor: colors.neutral.ink,
          borderRadius: 24,
          padding: 24,
          marginHorizontal: 16,
          marginTop: 12,
          overflow: 'hidden',
        }}
      >
        {/* Lime glow blob — decorative, no blurRadius on RN View */}
        <View
          style={{
            position: 'absolute',
            top: -50,
            end: -50,
            width: 200,
            height: 200,
            borderRadius: 999,
            backgroundColor: colors.brand.primary,
            opacity: 0.3,
          }}
          pointerEvents="none"
        />

        {/* Label row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {/* Static lime dot */}
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand.primary }} />
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
