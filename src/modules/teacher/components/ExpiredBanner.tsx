/**
 * ExpiredBanner
 * Prominent banner shown when teacher account is EXPIRED.
 * - States account is expired and write actions are blocked
 * - Renewal CTA: "Contact admin to reactivate"
 * - Supports EN/AR locale text
 *
 * Validates: Requirements 14.1, 14.2, 14.4
 */

import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';

export function ExpiredBanner() {
  const { t } = useTranslation();

  return (
    <View
      style={styles.banner}
      accessibilityRole="alert"
      accessibilityLabel={t('teacher.profile.expired.bannerTitle')}
    >
      <View style={styles.iconRow}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>!</Text>
        </View>
        <Text style={styles.title}>{t('teacher.profile.expired.bannerTitle')}</Text>
      </View>
      <Text style={styles.message}>{t('teacher.profile.expired.bannerMessage')}</Text>
      <View style={styles.ctaContainer}>
        <Text style={styles.ctaText}>{t('teacher.profile.expired.renewalCta')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    marginBottom: 12,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991B1B',
  },
  message: {
    fontSize: 14,
    color: '#B91C1C',
    marginBottom: 10,
    lineHeight: 20,
  },
  ctaContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  ctaText: {
    fontSize: 13,
    color: '#7F1D1D',
    fontWeight: '500',
    textAlign: 'center',
  },
});
