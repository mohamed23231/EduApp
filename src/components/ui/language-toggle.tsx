import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import colors from '@/components/ui/colors';
import { Icon } from '@/components/ui/icon';
import { useSelectedLanguage } from '@/lib/i18n';

/**
 * Shared LanguageToggle row — works for any role (parent, teacher, manager).
 * Provides a labelled card with EN / AR pill switch backed by `useSelectedLanguage`.
 * Reads RTL + label from i18n by default; both can be overridden via props.
 */

export type LanguageToggleProps = {
  label?: string;
  isRTL?: boolean;
  testID?: string;
};

export function LanguageToggle({ label, isRTL: isRTLProp, testID }: LanguageToggleProps) {
  const { t, i18n } = useTranslation();
  const { language, setLanguage } = useSelectedLanguage();
  const isArabic = language === 'ar';
  const isRTL = isRTLProp ?? i18n?.language === 'ar';
  const resolvedLabel = label ?? t('common.language', 'Language');

  return (
    <View
      testID={testID}
      style={{
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 14,
        backgroundColor: colors.neutral.card,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: colors.neutral.rule,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: colors.neutral.cardWarm,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="refresh" size={16} color={colors.neutral.ink} />
      </View>
      <Text
        style={{
          flex: 1,
          color: colors.neutral.ink,
          fontSize: 14,
          fontWeight: '600',
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        {resolvedLabel}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.neutral.cardWarm,
          borderRadius: 999,
          padding: 2,
          gap: 2,
        }}
      >
        {(['en', 'ar'] as const).map((code) => {
          const active = (code === 'ar') === isArabic;
          return (
            <Pressable
              key={code}
              onPress={() => setLanguage(code)}
              accessibilityRole="button"
              accessibilityLabel={code === 'ar' ? 'العربية' : 'English'}
              accessibilityState={{ selected: active }}
              testID={testID ? `${testID}-${code}` : undefined}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: active ? colors.neutral.ink : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: active ? colors.neutral.paper : colors.neutral.inkMuted,
                  letterSpacing: 0.4,
                }}
              >
                {code === 'ar' ? 'عربي' : 'EN'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
