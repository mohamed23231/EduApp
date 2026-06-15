import type { TFunction } from 'i18next';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Text, View } from 'react-native';
import {
  AuthShell,
  Icon,
  PressButton,
  Skeleton,
  TabaMark,
} from '@/components/ui';
import colors from '@/components/ui/colors';

/**
 * Non-form states for the parent-invite screen: the validating skeleton and
 * the invalid/expired error screen. Extracted so the main view stays under the
 * 110-line function cap.
 */

export function InviteValidatingScreen() {
  return (
    <AuthShell testID="invite-validating-shell">
      <StatusBar style="light" translucent />
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <Skeleton height={64} radius={32} />
        <Skeleton height={20} radius={10} />
      </View>
    </AuthShell>
  );
}

export type InviteErrorScreenProps = {
  t: TFunction;
  message: string;
  onBack: () => void;
};

export function InviteErrorScreen({ t, message, onBack }: InviteErrorScreenProps) {
  return (
    <AuthShell testID="invite-error-shell">
      <StatusBar style="light" translucent />
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        <TabaMark size={72} frame="ink" />
        <Text
          style={{
            color: colors.neutral.white,
            fontSize: 22,
            fontWeight: '700',
            letterSpacing: -0.5,
            textAlign: 'center',
          }}
        >
          {t('auth.invite.errorTitle')}
        </Text>
        <Text
          style={{
            color: colors.neutral.dim,
            fontSize: 14,
            fontWeight: '500',
            lineHeight: 22,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          {message}
        </Text>
        <View style={{ alignSelf: 'stretch' }}>
          <PressButton
            variant="gradient"
            size="lg"
            fullWidth
            onPress={onBack}
            label={t('common.back')}
            trailingIcon={<Icon name="arrowR" size={18} color={colors.neutral.white} />}
            testID="invite-back-button"
          />
        </View>
      </View>
    </AuthShell>
  );
}
