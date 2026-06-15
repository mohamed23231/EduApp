/**
 * Dashboard context pieces — active-context pill + org session shortcut cards.
 * Extracted from dashboard-screen.
 */

import type { TFunction } from 'i18next';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';

type ContextPillProps = {
  onPress: () => void;
  label: string;
};

export function ContextPill({ onPress, label }: ContextPillProps) {
  return (
    <View style={styles.contextPillRow}>
      <Pressable onPress={onPress} style={styles.contextPill}>
        <Text style={styles.contextPillText}>
          {label}
          {' ▾'}
        </Text>
      </Pressable>
    </View>
  );
}

type OrgCardsProps = {
  orgs: { organizationId: string; name: string }[];
  onSelect: (orgId: string) => void;
  t: TFunction;
};

export function OrgCards({ orgs, onSelect, t }: OrgCardsProps) {
  return (
    <View style={styles.orgCardsRow}>
      {orgs.map(org => (
        <Pressable
          key={org.organizationId}
          onPress={() => onSelect(org.organizationId)}
          style={({ pressed }) => [styles.orgCard, pressed && styles.orgCardPressed]}
          accessibilityRole="button"
          accessibilityLabel={org.name}
        >
          <View style={styles.orgCardInner}>
            <Text style={styles.orgCardName} numberOfLines={1}>{org.name}</Text>
            <View style={styles.orgCardAction}>
              <Text style={styles.orgCardActionText}>{t('teacher.dashboard.viewOrgSessions', 'View sessions')}</Text>
              <Ionicons name="chevron-forward" size={14} color="#6366F1" />
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  orgCardsRow: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  orgCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orgCardPressed: { opacity: 0.8 },
  orgCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  orgCardName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827', marginEnd: 8 },
  orgCardAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  orgCardActionText: { fontSize: 13, fontWeight: '600', color: '#6366F1' },
  contextPillRow: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 0 },
  contextPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  contextPillText: { fontSize: 13, fontWeight: '600', color: '#4338CA' },
});
