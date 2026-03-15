import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  I18nManager,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  getPhoneCountryByDialCode,
  getSupportedPhoneCountries,
  normalizeLocalPhoneNumberByCountry,
} from '@/shared/utils/phone';
import { Modal, useModal } from './modal';
import { Text } from './text';

type PhoneFieldProps = {
  label: string;
  countryCode: string;
  localNumber: string;
  onCountryCodeChange: (value: string) => void;
  onLocalNumberChange: (value: string) => void;
  localPlaceholder?: string;
  error?: string;
  disabled?: boolean;
  testIDPrefix?: string;
};

export function PhoneField({
  label,
  countryCode,
  localNumber,
  onCountryCodeChange,
  onLocalNumberChange,
  localPlaceholder,
  error,
  disabled = false,
  testIDPrefix = 'phone',
}: PhoneFieldProps) {
  const { t } = useTranslation();
  const translatedError = error ? t(error, { defaultValue: error }) : '';
  const selectedCountry = getPhoneCountryByDialCode(countryCode);
  const countryPickerModal = useModal();
  const countryOptions = React.useMemo(
    () =>
      getSupportedPhoneCountries().map(country => ({
        label: t(`auth.phone.countries.${country.iso2.toLowerCase()}`, {
          dialCode: country.dialCode,
          defaultValue: `${country.iso2} (${country.dialCode})`,
        }),
        value: country.dialCode,
      })),
    [t],
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.label, translatedError && styles.labelError]}>
        {label}
      </Text>
      <View style={styles.row}>
        <Pressable
          style={[
            styles.countryButton,
            translatedError && styles.inputError,
            disabled && styles.countryButtonDisabled,
          ]}
          onPress={() => !disabled && countryPickerModal.present()}
          testID={`${testIDPrefix}-country-picker`}
          disabled={disabled}
        >
          <Text style={styles.countryDialCode}>{selectedCountry.dialCode}</Text>
          <Text style={styles.countryChevron}>▾</Text>
        </Pressable>
        <TextInput
          value={localNumber}
          onChangeText={value => onLocalNumberChange(
            normalizeLocalPhoneNumberByCountry(selectedCountry.dialCode, value),
          )}
          editable={!disabled}
          keyboardType="phone-pad"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={localPlaceholder ?? selectedCountry.localPlaceholder}
          placeholderTextColor="#94A3B8"
          style={[styles.input, styles.localNumberInput, translatedError && styles.inputError]}
          testID={`${testIDPrefix}-local`}
        />
      </View>
      <Modal
        ref={countryPickerModal.ref}
        snapPoints={['38%']}
        title={t('auth.phone.countryCodeLabel')}
      >
        <View style={styles.modalSheet}>
          {countryOptions.map((option) => {
            const isSelected = option.value === selectedCountry.dialCode;
            return (
              <Pressable
                key={String(option.value)}
                style={[styles.countryOption, isSelected && styles.countryOptionSelected]}
                onPress={() => {
                  onCountryCodeChange(String(option.value));
                  countryPickerModal.dismiss();
                }}
              >
                <Text style={[styles.countryOptionLabel, isSelected && styles.countryOptionLabelSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Modal>
      {translatedError
        ? <Text style={styles.errorText}>{translatedError}</Text>
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    width: '100%',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 2,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 14,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 20,
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  countryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 12,
    width: 108,
  },
  countryButtonDisabled: {
    opacity: 0.5,
  },
  countryChevron: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
    marginTop: -2,
  },
  countryDialCode: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  countryOption: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  countryOptionSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  countryOptionLabel: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    color: '#334155',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  labelError: {
    color: '#DC2626',
  },
  localNumberInput: {
    flex: 1,
  },
  modalSheet: {
    gap: 10,
    paddingBottom: 22,
    paddingHorizontal: 20,
  },
  row: {
    alignItems: 'center',
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    gap: 8,
    width: '100%',
  },
  countryOptionLabelSelected: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
});
