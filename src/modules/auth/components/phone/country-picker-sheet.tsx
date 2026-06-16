import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { Icon, isoToFlagEmoji } from '@/components/ui';
import colors from '@/components/ui/colors';
import { Modal } from '@/components/ui/modal';
import { getSupportedPhoneCountries } from '@/shared/utils/phone';

/**
 * Shared country-code picker bottom sheet for the auth phone fields.
 * Extracted from login-form / phone-signup-form / phone-reset-password-form,
 * which each carried a verbatim copy. Same `Modal` + `useModal` pattern.
 */

export type CountryPickerSheetProps = {
  modalRef: React.ComponentProps<typeof Modal>['ref'];
  selectedDialCode: string;
  onSelect: (dialCode: string) => void;
  testIDPrefix?: string;
};

export function CountryPickerSheet({
  modalRef,
  selectedDialCode,
  onSelect,
  testIDPrefix = 'country',
}: CountryPickerSheetProps) {
  const { t } = useTranslation();
  const supportedCountries = React.useMemo(() => getSupportedPhoneCountries(), []);

  return (
    <Modal
      ref={modalRef}
      snapPoints={['38%']}
      title={t('auth.phone.countryCodeLabel', 'Country')}
    >
      <View style={{ paddingHorizontal: 20, paddingBottom: 22, gap: 8 }}>
        {supportedCountries.map((country) => {
          const selected = country.dialCode === selectedDialCode;
          const flag = isoToFlagEmoji(country.iso2);
          const label = t(`auth.phone.countries.${country.iso2.toLowerCase()}`, {
            dialCode: country.dialCode,
            defaultValue: `${country.iso2} (${country.dialCode})`,
          });
          return (
            <Pressable
              key={country.iso2}
              onPress={() => onSelect(country.dialCode)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              testID={`${testIDPrefix}-option-${country.iso2.toLowerCase()}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                paddingHorizontal: 14,
                borderRadius: 14,
                backgroundColor: selected
                  ? colors.brand.primaryGlow
                  : pressed
                    ? colors.neutral.paper
                    : 'transparent',
              })}
            >
              <Text style={{ fontSize: 24 }}>{flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.neutral.ink, fontSize: 15, fontWeight: '700' }}>
                  {label}
                </Text>
                <Text
                  style={{
                    color: colors.neutral.inkMuted,
                    fontSize: 13,
                    fontWeight: '500',
                    marginTop: 2,
                  }}
                >
                  {country.dialCode}
                </Text>
              </View>
              {selected
                ? <Icon name="check" size={20} color={colors.brand.primary} />
                : null}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}
