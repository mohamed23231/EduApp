import type { TextStyle } from 'react-native';
import * as React from 'react';
import { Text } from 'react-native';
import colors from '@/components/ui/colors';

/**
 * Inline error text in the absent (red) tone, used directly under a field.
 * Renders nothing when `message` is empty so layout doesn't jump.
 */
export function FieldErrorText({ message }: { message?: string | null }) {
  if (!message)
    return null;
  return (
    <Text
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{ color: colors.semantic.absent, fontSize: 12, marginTop: 6, marginStart: 4 }}
    >
      {message}
    </Text>
  );
}

/**
 * Centered form-level error banner in the absent tone. Used for the single
 * top-of-form error line. Renders nothing when empty.
 */
export function FormErrorText({ message, style }: { message?: string | null; style?: TextStyle }) {
  if (!message)
    return null;
  return (
    <Text
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        {
          color: colors.semantic.absent,
          fontSize: 13,
          fontWeight: '600',
          textAlign: 'center',
        },
        style,
      ]}
    >
      {message}
    </Text>
  );
}
