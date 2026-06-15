/**
 * TeacherStatusBadge
 * Renders a badge for TeacherStatus (INVITED | TRIAL | ACTIVE | SUSPENDED | EXPIRED)
 * with distinct visual styling per status and locale-aware text (EN/AR).
 *
 * Validates: Requirements 11.1, 11.2, 11.3
 */

import type { TeacherStatus } from '../types';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type TeacherStatusBadgeProps = {
  status: TeacherStatus | string;
};

type BadgeConfig = { bg: string; text: string; dot: string };

const STATUS_CONFIG: Record<string, BadgeConfig> = {
  INVITED: { bg: colors.neutral.cardWarm, text: colors.neutral.inkMuted, dot: colors.neutral.dim },
  TRIAL: { bg: colors.semantic.excusedSoft, text: colors.semantic.excusedInk, dot: colors.semantic.excused },
  ACTIVE: { bg: colors.semantic.presentSoft, text: colors.semantic.presentInk, dot: colors.semantic.present },
  SUSPENDED: { bg: colors.semantic.absentSoft, text: colors.semantic.absentInk, dot: colors.semantic.absent },
  EXPIRED: { bg: colors.neutral.cardWarm, text: colors.neutral.inkMuted, dot: colors.neutral.dim },
};

const FALLBACK_CONFIG: BadgeConfig = { bg: colors.neutral.cardWarm, text: colors.neutral.inkMuted, dot: colors.neutral.dim };

export function TeacherStatusBadge({ status }: TeacherStatusBadgeProps) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status] ?? FALLBACK_CONFIG;

  return (
    <View
      style={[styles.container, { backgroundColor: config.bg }]}
      accessibilityRole="text"
      accessibilityLabel={t(`teacher.profile.status.${status}`, { defaultValue: status })}
    >
      <View style={[styles.dot, { backgroundColor: config.dot }]} />
      <Text style={[styles.label, { color: config.text }]}>
        {t(`teacher.profile.status.${status}`, { defaultValue: status })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
