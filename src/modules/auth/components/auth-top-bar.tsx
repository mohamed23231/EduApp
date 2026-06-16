import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { Icon, TabaMark } from '@/components/ui';
import colors from '@/components/ui/colors';
import { useSelectedLanguage } from '@/lib/i18n';

/**
 * Shared dark-shell top bar for the auth screens: optional back chip, corner
 * mark, and a language toggle pill. Extracted from signup / reset / parent-
 * invite views, which each repeated the same markup, to keep those view files
 * under the 300-line cap.
 */

export type AuthTopBarProps = {
  onBack?: () => void;
  markSize?: number;
  backTestID?: string;
  markTestID?: string;
};

export function AuthTopBar({ onBack, markSize = 48, backTestID, markTestID }: AuthTopBarProps) {
  const { t } = useTranslation();
  const { language, setLanguage } = useSelectedLanguage();
  const toggleLanguage = () => setLanguage(language === 'en' ? 'ar' : 'en');

  return (
    <View
      style={{
        paddingHorizontal: 24,
        paddingTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {onBack
          ? (
              <Pressable
                onPress={onBack}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                testID={backTestID}
                accessibilityRole="button"
                accessibilityLabel={t('common.goBack', 'Go back')}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(255,255,255,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="arrowL" size={18} color={colors.neutral.white} />
              </Pressable>
            )
          : null}
        <TabaMark size={markSize} frame="ink" testID={markTestID} />
      </View>
      <Pressable
        onPress={toggleLanguage}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel={t('auth.topBar.toggleLanguage', 'Change language')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <Icon name="globe" size={14} color={colors.neutral.dim} />
        <Text style={{ color: colors.neutral.dim, fontSize: 13, fontWeight: '700' }}>
          {language === 'en' ? 'العربية' : 'English'}
        </Text>
      </Pressable>
    </View>
  );
}
