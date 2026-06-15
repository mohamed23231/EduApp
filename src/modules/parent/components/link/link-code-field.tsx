import Ionicons from '@expo/vector-icons/Ionicons';
import * as React from 'react';
import { I18nManager, TextInput, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

/**
 * Access-code input + inline error messages for the link-student screen.
 * Error state recolors the field border/background (absent tokens).
 */

type LinkCodeFieldProps = {
  accessCode: string;
  onChangeText: (text: string) => void;
  isPending: boolean;
  hasError: boolean;
  label: string;
  placeholder: string;
  validationError: string | null;
  errorMessage: string | null;
};

export function LinkCodeField({
  accessCode,
  onChangeText,
  isPending,
  hasError,
  label,
  placeholder,
  validationError,
  errorMessage,
}: LinkCodeFieldProps) {
  return (
    <>
      <Text className="mb-2 text-sm font-semibold" style={{ color: colors.neutral.ink }}>
        {label}
      </Text>
      <View
        className="flex-row items-center rounded-xl px-4"
        style={{
          borderWidth: 1,
          borderColor: hasError ? colors.semantic.absent : colors.neutral.rule,
          backgroundColor: hasError ? colors.semantic.absentSoft : colors.neutral.card,
        }}
      >
        <TextInput
          className="flex-1 py-3.5 text-base"
          style={{
            color: colors.neutral.ink,
            textAlign: I18nManager.isRTL ? 'right' : 'left',
            writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.neutral.inkMuted}
          value={accessCode}
          onChangeText={onChangeText}
          editable={!isPending}
          testID="access-code-input"
          autoCapitalize="characters"
          autoCorrect={false}
          accessibilityLabel={label}
        />
        <Ionicons name="qr-code-outline" size={20} color={colors.neutral.inkMuted} style={{ marginStart: 8 }} />
      </View>

      {validationError
        ? (
            <Text className="mt-2 text-sm" style={{ color: colors.semantic.absent }} accessibilityRole="alert">
              {validationError}
            </Text>
          )
        : null}
      {errorMessage
        ? (
            <Text
              className="mt-2 text-sm"
              style={{ color: colors.semantic.absent }}
              testID="error-message"
              accessibilityRole="alert"
            >
              {errorMessage}
            </Text>
          )
        : null}
    </>
  );
}
