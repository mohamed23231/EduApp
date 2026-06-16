import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import colors from '@/components/ui/colors';

type FullNameFieldProps = {
  isRTL: boolean;
  value: string;
  onChangeText: (value: string) => void;
};

export function FullNameField({ isRTL, value, onChangeText }: FullNameFieldProps) {
  const { t } = useTranslation();
  return (
    <View
      style={{
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 16,
        backgroundColor: colors.neutral.card,
        borderWidth: 1.5,
        borderColor: colors.neutral.rule,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCorrect={false}
        placeholder={t('auth.signup.fullNamePlaceholder')}
        placeholderTextColor={colors.neutral.inkMuted}
        testID="fullName-input"
        style={{
          flex: 1,
          color: colors.neutral.ink,
          fontSize: 16,
          fontWeight: '600',
          padding: 0,
          textAlign: isRTL ? 'right' : 'left',
        }}
      />
    </View>
  );
}
