/**
 * EmptyState
 * Reusable empty state with icon illustration and optional CTA button.
 */

import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, Text } from '@/components/ui';

type EmptyStateProps = {
  icon?: ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon = 'document-text-outline',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const showAction = actionLabel && onAction;

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.iconWrap}>
        <View style={styles.circle}>
          <Ionicons name={icon} size={36} color="#3B82F6" />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text style={styles.title}>{title}</Text>
      </Animated.View>

      {message
        ? <Animated.View entering={FadeInDown.delay(200).duration(400)}><Text style={styles.message}>{message}</Text></Animated.View>
        : null}

      {showAction
        ? <Animated.View entering={FadeInDown.delay(300).duration(400)}><Button label={actionLabel} onPress={onAction} variant="default" style={styles.btn} /></Animated.View>
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 48,
    gap: 6,
  },
  iconWrap: {
    marginBottom: 12,
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  btn: {
    marginTop: 4,
    minWidth: 200,
  },
});
