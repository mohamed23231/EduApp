/**
 * StatusBadge
 * Visual pill for SessionState (DRAFT | ACTIVE | CLOSED).
 */

import type { SessionState } from '../types';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type StatusBadgeProps = {
  state: SessionState;
};

const CONFIG: Record<SessionState, { bg: string; text: string; dot: string }> = {
  DRAFT: { bg: colors.semantic.excusedSoft, text: colors.semantic.excusedInk, dot: colors.semantic.excused },
  ACTIVE: { bg: colors.semantic.presentSoft, text: colors.semantic.presentInk, dot: colors.semantic.present },
  CLOSED: { bg: colors.neutral.cardWarm, text: colors.neutral.inkMuted, dot: colors.neutral.dim },
};

export function StatusBadge({ state }: StatusBadgeProps) {
  const { t } = useTranslation();
  const { bg, text, dot } = CONFIG[state];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.label, { color: text }]}>
        {t(`teacher.sessions.status.${state}`)}
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
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
