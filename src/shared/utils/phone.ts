export type SupportedPhoneCountry = 'SA' | 'EG';

export type PhoneCountryConfig = {
  iso2: SupportedPhoneCountry;
  dialCode: string;
  localPlaceholder: string;
  validationKey: string;
  localPattern: RegExp;
  stripLeadingZero?: boolean;
};

const PHONE_COUNTRIES: readonly PhoneCountryConfig[] = [
  {
    iso2: 'SA',
    dialCode: '+966',
    localPlaceholder: '5XXXXXXXX',
    validationKey: 'auth.phone.validation.saudiInvalid',
    localPattern: /^5\d{8}$/,
    stripLeadingZero: true,
  },
  {
    iso2: 'EG',
    dialCode: '+20',
    localPlaceholder: '10XXXXXXXX',
    validationKey: 'auth.phone.validation.egyptInvalid',
    localPattern: /^(10|11|12|15)\d{8}$/,
    stripLeadingZero: true,
  },
] as const;

const FALLBACK_COUNTRY: PhoneCountryConfig = PHONE_COUNTRIES[0];

export const DEFAULT_COUNTRY_CODE = FALLBACK_COUNTRY.dialCode;

const ARABIC_INDIC_ZERO_CODE = '٠'.charCodeAt(0);
const EXT_ARABIC_INDIC_ZERO_CODE = '۰'.charCodeAt(0);

export function getSupportedPhoneCountries(): readonly PhoneCountryConfig[] {
  return PHONE_COUNTRIES;
}

/**
 * Normalizes Arabic-Indic numerals to ASCII digits so inputs work with Arabic keyboards.
 */
export function normalizeNumerals(value: string): string {
  return value
    .replace(/[\u0660-\u0669]/g, char => String(char.charCodeAt(0) - ARABIC_INDIC_ZERO_CODE))
    .replace(/[\u06F0-\u06F9]/g, char => String(char.charCodeAt(0) - EXT_ARABIC_INDIC_ZERO_CODE));
}

export function sanitizeCountryCode(value: string): string {
  const normalized = value.trim();
  const matched = PHONE_COUNTRIES.find(country => country.dialCode === normalized);
  return matched?.dialCode ?? DEFAULT_COUNTRY_CODE;
}

export function sanitizeLocalPhoneNumber(value: string): string {
  return normalizeNumerals(value).replace(/\D/g, '').slice(0, 15);
}

export function sanitizeOtpCode(value: string, maxLength = 6): string {
  return normalizeNumerals(value).replace(/\D/g, '').slice(0, maxLength);
}

export function getPhoneCountryByDialCode(countryCode: string): PhoneCountryConfig {
  return PHONE_COUNTRIES.find(country => country.dialCode === countryCode) ?? FALLBACK_COUNTRY;
}

export function getPhoneValidationErrorKey(countryCode: string): string {
  return getPhoneCountryByDialCode(countryCode).validationKey;
}

export function normalizeLocalPhoneNumberByCountry(
  countryCode: string,
  localPhoneNumber: string,
): string {
  const country = getPhoneCountryByDialCode(countryCode);
  const normalizedDigits = sanitizeLocalPhoneNumber(localPhoneNumber);

  if (country.stripLeadingZero && normalizedDigits.startsWith('0')) {
    return normalizedDigits.slice(1);
  }

  return normalizedDigits;
}

export function isValidLocalPhoneNumberByCountry(
  countryCode: string,
  localPhoneNumber: string,
): boolean {
  const country = getPhoneCountryByDialCode(countryCode);
  const normalizedLocalNumber = normalizeLocalPhoneNumberByCountry(countryCode, localPhoneNumber);
  return country.localPattern.test(normalizedLocalNumber);
}

export function buildE164Phone(
  countryCode: string,
  localPhoneNumber: string,
): string | null {
  const country = getPhoneCountryByDialCode(countryCode);
  const normalizedLocalNumber = normalizeLocalPhoneNumberByCountry(
    country.dialCode,
    localPhoneNumber,
  );

  if (!isValidLocalPhoneNumberByCountry(country.dialCode, normalizedLocalNumber)) {
    return null;
  }

  return `${country.dialCode}${normalizedLocalNumber}`;
}

export function splitE164Phone(
  value?: string | null,
): { countryCode: string; localNumber: string } {
  const phone = value?.trim();
  if (!phone || !phone.startsWith('+')) {
    return { countryCode: DEFAULT_COUNTRY_CODE, localNumber: '' };
  }

  const match = PHONE_COUNTRIES
    .slice()
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find(country => phone.startsWith(country.dialCode));

  if (!match) {
    return { countryCode: DEFAULT_COUNTRY_CODE, localNumber: '' };
  }

  return {
    countryCode: match.dialCode,
    localNumber: normalizeLocalPhoneNumberByCountry(
      match.dialCode,
      phone.slice(match.dialCode.length),
    ),
  };
}

export function isValidE164Phone(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(value);
}
