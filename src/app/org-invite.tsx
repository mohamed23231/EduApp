import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, View } from 'react-native';
import { Text } from '@/components/ui';
import { removeItem } from '@/lib/storage';
import { OrgInvitationScreen } from '@/modules/organization/shared/screens/org-invitation-screen';

export default function OrgInviteRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [resolvedToken] = useState<string | undefined>(typeof token === 'string' ? token : undefined);

  if (!resolvedToken) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-paper">
        <View className="px-6">
          <Text className="font-inter text-center text-base text-slate-500">
            {t('orgInvitation.invalidToken')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <OrgInvitationScreen
      token={resolvedToken}
      onAccepted={() => {
        void removeItem('pendingOrgInviteToken');
        router.replace('/(teacher)/(tabs)/dashboard' as never);
      }}
      onDeclined={() => {
        void removeItem('pendingOrgInviteToken');
        router.back();
      }}
    />
  );
}
