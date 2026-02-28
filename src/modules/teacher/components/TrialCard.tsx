/**
 * TrialCard
 * Displays trial period details: end date, days remaining, usage vs limits.
 * - Renders null limits as "Unlimited"
 * - Shows a visual warning when ≤3 days remaining
 * - Only rendered when teacherStatus is TRIAL
 *
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4
 */

import type { TrialData } from '../types';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';

type TrialCardProps = {
  trial: TrialData;
};

const WARNING_THRESHOLD = 3;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  catch {
    return iso;
  }
}

type UsageRowProps = {
  label: string;
  current: number;
  limit: number | null;
  unlimitedLabel: string;
  usageFormat: string;
};

function UsageRow({ label, current, limit, unlimitedLabel, usageFormat }: UsageRowProps) {
  const limitDisplay = limit === null
    ? unlimitedLabel
    : usageFormat
        .replace('{{current}}', String(current))
        .replace('{{limit}}', String(limit));

  return (
    <View style={styles.usageRow}>
      <Text style={styles.usageLabel}>{label}</Text>
      <Text style={styles.usageValue}>{limit === null ? `${current} / ${unlimitedLabel}` : limitDisplay}</Text>
    </View>
  );
}

export function TrialCard({ trial }: TrialCardProps) {
  const { t } = useTranslation();
  const isWarning = trial.daysRemaining <= WARNING_THRESHOLD;

  return (
    <View style={[styles.card, isWarning && styles.cardWarning]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('teacher.profile.trial.title')}</Text>
        {isWarning && (
          <View style={styles.warningBadge}>
            <Text style={styles.warningText}>
              {t('teacher.profile.trial.warningDaysRemaining')}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.endDate, isWarning && styles.endDateWarning]}>
        {t('teacher.profile.trial.endDate', { date: formatDate(trial.endDate) })}
      </Text>

      <Text style={[styles.daysRemaining, isWarning && styles.daysRemainingWarning]}>
        {t('teacher.profile.trial.daysRemaining', { count: trial.daysRemaining })}
      </Text>

      <View style={styles.divider} />

      <Text style={styles.usageTitle}>{t('teacher.profile.trial.usage')}</Text>

      <UsageRow
        label={t('teacher.profile.trial.students')}
        current={trial.usage.currentStudents}
        limit={trial.limits.maxStudents}
        unlimitedLabel={t('teacher.profile.trial.unlimited')}
        usageFormat={t('teacher.profile.trial.usageFormat')}
      />
      <UsageRow
        label={t('teacher.profile.trial.sessions')}
        current={trial.usage.currentSessions}
        limit={trial.limits.maxSessions}
        unlimitedLabel={t('teacher.profile.trial.unlimited')}
        usageFormat={t('teacher.profile.trial.usageFormat')}
      />
      <UsageRow
        label={t('teacher.profile.trial.sessionHours')}
        current={trial.usage.currentSessionHours}
        limit={trial.limits.maxSessionHours}
        unlimitedLabel={t('teacher.profile.trial.unlimited')}
        usageFormat={t('teacher.profile.trial.usageFormat')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  cardWarning: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
  },
  warningBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  endDate: {
    fontSize: 13,
    color: '#78350F',
    marginBottom: 2,
  },
  endDateWarning: {
    color: '#C2410C',
  },
  daysRemaining: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  daysRemainingWarning: {
    color: '#DC2626',
  },
  divider: {
    height: 1,
    backgroundColor: '#FDE68A',
    marginBottom: 12,
  },
  usageTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  usageLabel: {
    fontSize: 13,
    color: '#78350F',
  },
  usageValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
});
