import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { GradientText, TabaMark } from '@/components/ui';
import colors from '@/components/ui/colors';

type OnboardingHeroProps = {
  isRTL: boolean;
};

export function OnboardingHero({ isRTL }: OnboardingHeroProps) {
  const { t } = useTranslation();
  return (
    <>
      {/* Top bar — small ink mark */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 8,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TabaMark size={48} frame="ink" />
      </View>

      {/* Hero */}
      <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
        <Text
          style={{
            color: colors.neutral.ink,
            fontSize: 30,
            lineHeight: 34,
            fontWeight: '700',
            letterSpacing: -1,
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
          }}
        >
          {t('auth.onboarding.heroLine1', 'Tell us')}
        </Text>
        <View style={{ marginTop: 2, alignSelf: isRTL ? 'flex-end' : 'flex-start' }}>
          <GradientText size={30} weight="700">
            {t('auth.onboarding.heroLine2', 'about you.')}
          </GradientText>
        </View>
        <Text
          style={{
            color: colors.neutral.inkMuted,
            fontSize: 14,
            lineHeight: 22,
            fontWeight: '500',
            marginTop: 12,
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
          }}
        >
          {t('auth.onboarding.subheadline', 'A few details to set up your profile.')}
        </Text>
      </View>
    </>
  );
}
