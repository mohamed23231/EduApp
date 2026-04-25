import * as React from 'react';
import { Text, TextInput, View } from 'react-native';

import colors from '@/components/ui/colors';

type TextFieldProps = {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  type?: 'text' | 'tel' | 'email' | 'numeric' | 'password';
  error?: string;
  inputRef?: React.RefObject<TextInput | null>;
  autoFocus?: boolean;
  returnKeyType?: 'done' | 'next' | 'go' | 'send' | 'search';
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
  icon?: React.ReactNode;
  secureTextEntry?: boolean;
  maxLength?: number;
  textContentType?: string;
  autoComplete?: string;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

const keyboardMap: Record<string, 'default' | 'phone-pad' | 'email-address' | 'numeric'> = {
  text: 'default',
  tel: 'phone-pad',
  email: 'email-address',
  numeric: 'numeric',
  password: 'default',
};

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  inputRef,
  autoFocus,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  icon,
  secureTextEntry,
  maxLength,
  textContentType,
  autoComplete,
  testID,
  accessibilityLabel,
  accessibilityHint,
}: TextFieldProps) {
  const isPassword = type === 'password' || secureTextEntry;
  const borderColor = error ? colors.semantic.absent : colors.neutral.rule;

  return (
    <View testID={testID ? `${testID}-wrapper` : undefined}>
      {label
        ? (
            <Text
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: colors.neutral.inkMuted,
                marginBottom: 4,
              }}
              testID={testID ? `${testID}-label` : undefined}
            >
              {label}
            </Text>
          )
        : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor,
          borderRadius: colors.radii.r2,
          backgroundColor: colors.neutral.card,
          paddingHorizontal: icon ? 10 : 14,
          paddingVertical: 12,
        }}
      >
        {icon ? <View style={{ marginEnd: 8 }}>{icon}</View> : null}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.neutral.dim}
          secureTextEntry={isPassword}
          keyboardType={keyboardMap[type] ?? 'default'}
          autoFocus={autoFocus}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          maxLength={maxLength}
          textContentType={textContentType as TextInput['props']['textContentType']}
          autoComplete={autoComplete as TextInput['props']['autoComplete']}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          testID={testID}
          style={{
            flex: 1,
            fontSize: 15,
            color: colors.neutral.ink,
            padding: 0,
          }}
        />
      </View>
      {error
        ? (
            <Text
              testID={testID ? `${testID}-error` : undefined}
              style={{
                fontSize: 12,
                color: colors.semantic.absent,
                marginTop: 4,
              }}
            >
              {error}
            </Text>
          )
        : null}
    </View>
  );
}
