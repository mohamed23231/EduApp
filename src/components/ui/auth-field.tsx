import * as React from 'react';
import { TextInput, View } from 'react-native';
import colors from '@/components/ui/colors';

/**
 * Dark-on-dark form primitives shared by every auth screen
 * (login, signup, OTP, reset, parent invite). Per `contracts/visual-auth.md`.
 *
 * Fields render at height 56 with rgba(255,255,255,0.06) fill and a 1.5px
 * rgba(255,255,255,0.12) hairline border. Error state swaps the border to
 * `colors.semantic.absent`. Inputs are weight 600 white on the dark fill.
 */

export type AuthFieldShellProps = {
  hasError?: boolean;
  children: React.ReactNode;
  marginEnd?: number;
  flex?: number;
};

export function AuthFieldShell({
  hasError,
  children,
  marginEnd,
  flex = 1,
}: AuthFieldShellProps) {
  return (
    <View
      style={{
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1.5,
        borderColor: hasError
          ? colors.semantic.absent
          : 'rgba(255,255,255,0.12)',
        flexDirection: 'row',
        alignItems: 'center',
        flex,
        marginEnd,
      }}
    >
      {children}
    </View>
  );
}

export type AuthInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  secureTextEntry?: boolean;
  testID?: string;
  textAlign?: 'left' | 'right' | 'auto';
  fontSize?: number;
  letterSpacing?: number;
  editable?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  textContentType?: 'oneTimeCode' | 'none';
};

export function AuthInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = 'none',
  autoCorrect = false,
  secureTextEntry,
  testID,
  textAlign = 'left',
  fontSize = 17,
  letterSpacing = 0.3,
  editable = true,
  maxLength,
  autoFocus,
  textContentType,
}: AuthInputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="rgba(255,255,255,0.35)"
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      secureTextEntry={secureTextEntry}
      editable={editable}
      maxLength={maxLength}
      autoFocus={autoFocus}
      textContentType={textContentType}
      testID={testID}
      style={{
        flex: 1,
        color: colors.neutral.white,
        fontSize,
        fontWeight: '600',
        letterSpacing,
        padding: 0,
        textAlign,
      }}
    />
  );
}

/**
 * ISO-2 country code → flag emoji via Regional Indicator Symbols.
 * 'EG' → 🇪🇬, 'SA' → 🇸🇦, etc. Falls back to globe glyph on bad input.
 */
export function isoToFlagEmoji(iso2: string): string {
  if (!iso2 || iso2.length !== 2)
    return '🌐';
  const A = 0x41;
  const RIS_A = 0x1F1E6;
  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map(ch => ch.charCodeAt(0) - A + RIS_A);
  return String.fromCodePoint(...codePoints);
}
