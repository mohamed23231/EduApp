import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import colors from '@/components/ui/colors';

type OnboardingLegalNoteProps = {
  marginBottom: number;
};

export function OnboardingLegalNote({ marginBottom }: OnboardingLegalNoteProps) {
  const { t } = useTranslation();
  return (
    <Text
      style={{
        color: colors.neutral.inkMuted,
        fontSize: 11,
        lineHeight: 16,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 6,
        marginBottom,
      }}
    >
      {t('auth.login.legalLine', 'By continuing you agree to Taba3ny\'s Terms and Privacy Policy.')}
    </Text>
  );
}
