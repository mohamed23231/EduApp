/**
 * SubscriptionCard
 * Displays subscription details: plan name (from snapshot), status, start/end dates,
 * billing cycle, days remaining, and limits.
 * - Renders null limits as "Unlimited"
 * - Shows expired state when teacherStatus is EXPIRED
 *
 * Validates: Requirements 13.1, 13.2, 13.3, 13.4
 */

import type { SubscriptionData, TeacherStatus } from '../types';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';

type SubscriptionCardProps = {
  subscription: SubscriptionData;
  teacherStatus: TeacherStatus | string;
};

function formatDate(iso: string | null): string {
  if (!iso)
    return '—';
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

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function SubscriptionCard({ subscription, teacherStatus }: SubscriptionCardProps) {
  const { t } = useTranslation();
  const isExpired = teacherStatus === 'EXPIRED';

  const billingCycleLabel = subscription.billingCycle === 'MONTHLY'
    ? t('teacher.profile.subscription.billingCycleMonthly')
    : t('teacher.profile.subscription.billingCycleYearly');

  const formatLimit = (val: number | null) =>
    val === null ? t('teacher.profile.subscription.unlimited') : String(val);

  return (
    <View style={[styles.card, isExpired && styles.cardExpired]}>
      <View style={styles.header}>
        <Text style={[styles.title, isExpired && styles.titleExpired]}>
          {t('teacher.profile.subscription.title')}
        </Text>
        {isExpired && (
          <View style={styles.expiredBadge}>
            <Text style={styles.expiredBadgeText}>
              {t('teacher.profile.subscription.expiredLabel')}
            </Text>
          </View>
        )}
      </View>

      <InfoRow
        label={t('teacher.profile.subscription.planName')}
        value={subscription.planName}
      />
      <InfoRow
        label={t('teacher.profile.subscription.startDate')}
        value={formatDate(subscription.startDate)}
      />
      <InfoRow
        label={t('teacher.profile.subscription.endDate')}
        value={formatDate(subscription.endDate)}
      />
      <InfoRow
        label={t('teacher.profile.subscription.billingCycle')}
        value={billingCycleLabel}
      />

      {!isExpired && subscription.daysRemaining != null && (
        <Text style={styles.daysRemaining}>
          {t('teacher.profile.subscription.daysRemaining', { count: subscription.daysRemaining })}
        </Text>
      )}

      <View style={styles.divider} />

      <InfoRow
        label={t('teacher.profile.trial.students')}
        value={formatLimit(subscription.limits.maxStudents)}
      />
      <InfoRow
        label={t('teacher.profile.trial.sessions')}
        value={formatLimit(subscription.limits.maxSessions)}
      />
      <InfoRow
        label={t('teacher.profile.trial.sessionHours')}
        value={formatLimit(subscription.limits.maxSessionHours)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 12,
  },
  cardExpired: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
  },
  titleExpired: {
    color: '#6B7280',
  },
  expiredBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  expiredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#374151',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  daysRemaining: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D4ED8',
    marginTop: 4,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#BFDBFE',
    marginVertical: 10,
  },
});
