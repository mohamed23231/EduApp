import * as React from 'react';
import { Text, View } from 'react-native';
import { AuthFieldShell, AuthInput } from '@/components/ui';
import colors from '@/components/ui/colors';

/**
 * Six-cell OTP input per `visual-auth.md`. A hidden full-width input captures
 * keystrokes; filled cells flip to the brand-green fill + border. Shared by the
 * phone signup-verify and password-reset flows (OTP exists for those two only).
 */

export type OtpCellsProps = {
  value: string;
  onChange: (value: string) => void;
  isRTL: boolean;
  testID?: string;
};

export function OtpCells({ value, onChange, isRTL, testID = 'otp-input' }: OtpCellsProps) {
  const cells = Array.from({ length: 6 }, (_, idx) => value[idx] ?? '');
  return (
    <View style={{ position: 'relative' }}>
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
        {cells.map((char, idx) => {
          const filled = char.length > 0;
          return (
            <View
              // eslint-disable-next-line react/no-array-index-key
              key={idx}
              style={{
                width: 46,
                height: 60,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: filled ? colors.auth.brandTint18 : colors.auth.fieldFill,
                borderWidth: 1.5,
                borderColor: filled ? colors.brand.primary : colors.auth.fieldBorderStrong,
              }}
            >
              <Text style={{ color: colors.neutral.white, fontSize: 26, fontWeight: '700' }}>
                {char}
              </Text>
            </View>
          );
        })}
      </View>
      <View
        style={{ position: 'absolute', top: 0, start: 0, end: 0, bottom: 0, opacity: 0.01 }}
      >
        <AuthFieldShell>
          <AuthInput
            value={value}
            onChangeText={onChange}
            placeholder=""
            keyboardType="numeric"
            maxLength={6}
            autoFocus
            textContentType="oneTimeCode"
            testID={testID}
            textAlign={isRTL ? 'right' : 'left'}
          />
        </AuthFieldShell>
      </View>
    </View>
  );
}
