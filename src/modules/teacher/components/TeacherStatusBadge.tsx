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

type TeacherStatusBadgeProps = {
  status: TeacherStatus | string;
};

type BadgeConfig = { bg: string; text: string; dot: string };

const STATUS_CONFIG: Record<string, BadgeConfig> = {
  INVITED: { bg: '#EDE9FE', text: '#5B21B6', dot: '#7C3AED' },
  TRIAL: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  ACTIVE: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  SUSPENDED: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  EXPIRED: { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' },
};

const FALLBACK_CONFIG: BadgeConfig = { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' };

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
