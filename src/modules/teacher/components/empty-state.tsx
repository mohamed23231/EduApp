/**
 * EmptyState component
 * Reusable empty state with illustration and localized message
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 7.2, 7.3, 9.2, 14.1, 15.1, 15.5
 */

import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';

type EmptyStateProps = {
  emoji?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ emoji = '📋', title, message, actionLabel, onAction }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.illustrationCircle}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>

      {message && <Text style={styles.message}>{message}</Text>}

      {actionLabel && onAction && (
        <Text style={styles.actionButton} onPress={onAction}>
          {actionLabel}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  illustrationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  actionButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
