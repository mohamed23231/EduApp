/**
 * DashboardHero — teacher greeting + today/active session counts.
 * Extracted from dashboard-screen.
 */

import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { getGreeting } from '../../utils/dashboard-name';

type DashboardHeroProps = {
  firstName: string;
  sessionCount: number;
  activeCount: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
};

export function DashboardHero({ firstName, sessionCount, activeCount, t }: DashboardHeroProps) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroTop}>
        <View style={styles.heroLeft}>
          <Text style={styles.greetingText}>{getGreeting(t)}</Text>
          <Text style={styles.heroName} numberOfLines={1}>{firstName}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{firstName[0]?.toUpperCase() ?? '?'}</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{sessionCount}</Text>
          <Text style={styles.statLabel}>{t('teacher.dashboard.sessionsToday')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{activeCount}</Text>
          <Text style={styles.statLabel}>{t('teacher.dashboard.activeSessions')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.neutral.ink,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  heroLeft: { flex: 1, marginEnd: 12 },
  greetingText: { fontSize: 14, color: colors.neutral.dim, fontWeight: '500', marginBottom: 2 },
  heroName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 12, color: colors.neutral.dim, fontWeight: '500', marginTop: 2 },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 4,
  },
});
