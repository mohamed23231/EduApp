import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text } from 'react-native';
import { isoToFlagEmoji } from '@/components/ui';
import colors from '@/components/ui/colors';
import { getPhoneCountryByDialCode } from '@/shared/utils/phone';

/**
 * Tappable country-code chip (flag + dial code) that opens the country sheet.
 * Shared by the auth phone inputs. Matches `visual-auth.md`: 56px tall, 16
 * radius, frosted fill, brand-green pressed state.
 */

export type CountryCodeChipProps = {
  dialCode: string;
  onPress: () => void;
  testID?: string;
};

export function CountryCodeChip({ dialCode, onPress, testID }: CountryCodeChipProps) {
  const { t } = useTranslation();
  const country = getPhoneCountryByDialCode(dialCode);
  const flag = isoToFlagEmoji(country.iso2);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('auth.phone.countryCodeLabel', 'Country')}
      testID={testID}
      style={({ pressed }) => ({
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 14,
        backgroundColor: pressed ? 'rgba(34,197,114,0.30)' : 'rgba(255,255,255,0.06)',
        borderWidth: 1.5,
        borderColor: pressed ? colors.brand.primary : 'rgba(255,255,255,0.12)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      })}
    >
      <Text style={{ fontSize: 18 }}>{flag}</Text>
      <Text style={{ color: colors.neutral.white, fontSize: 15, fontWeight: '700' }}>
        {dialCode}
      </Text>
      <Text style={{ color: colors.neutral.dim, fontSize: 14, marginStart: 2 }}>▾</Text>
    </Pressable>
  );
}
