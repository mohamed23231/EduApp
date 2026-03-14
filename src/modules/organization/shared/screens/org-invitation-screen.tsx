import type { PendingInvitation } from '../services/contexts-api.service';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, SafeAreaView, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import { useAcceptInvitationById, useAcceptInvitationByToken, useDeclineInvitationById } from '../hooks/use-contexts';

type Props = {
  token?: string;
  invitation?: PendingInvitation;
  onAccepted: () => void;
  onDeclined: () => void;
};

export function OrgInvitationScreen({ token, invitation, onAccepted, onDeclined }: Props) {
  const { t } = useTranslation();
  const [message, setMessage] = useState<string | null>(null);
  const acceptByToken = useAcceptInvitationByToken();
  const acceptById = useAcceptInvitationById();
  const declineById = useDeclineInvitationById();

  const orgName = invitation?.organizationName ?? t('orgInvitation.unknownOrg');
  const managerName = invitation?.managerName ?? '';

  const handleAccept = async () => {
    try {
      if (token) {
        await acceptByToken.mutateAsync(token);
      }
      else if (invitation) {
        await acceptById.mutateAsync(invitation.id);
      }
      onAccepted();
    }
    catch (error) {
      setMessage(getApiErrorMessage(error, t('orgInvitation.acceptError')));
    }
  };

  const handleDecline = async () => {
    try {
      if (invitation) {
        await declineById.mutateAsync(invitation.id);
      }
      onDeclined();
    }
    catch (error) {
      setMessage(getApiErrorMessage(error, t('orgInvitation.declineError')));
    }
  };

  const isPending = acceptByToken.isPending || acceptById.isPending || declineById.isPending;

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1e8]">
      <View className="flex-1 px-6 py-8">
        <View className="rounded-[32px] bg-[#102820] p-6">
          <Text className="font-inter text-sm tracking-[1.6px] text-[#95d5b2] uppercase">
            {t('orgInvitation.badge')}
          </Text>
          <Text className="font-inter mt-2 text-3xl font-semibold text-[#f6efe2]">
            {orgName}
          </Text>
          {managerName
            ? (
                <Text className="font-inter mt-2 text-base text-[#dbe7df]">
                  {t('orgInvitation.invitedBy', { name: managerName })}
                </Text>
              )
            : null}
        </View>
        <View className="mt-6">
          <Text className="font-inter text-base text-slate-600">
            {t('orgInvitation.body', { org: orgName })}
          </Text>
        </View>
        {message
          ? (
              <Text className="font-inter mt-4 text-sm text-red-500">{message}</Text>
            )
          : null}
        {isPending
          ? (
              <ActivityIndicator className="mt-8" size="large" />
            )
          : (
              <View className="mt-8 gap-3">
                <Button label={t('orgInvitation.accept')} onPress={handleAccept} />
                {invitation
                  ? (
                      <Button variant="outline" label={t('orgInvitation.decline')} onPress={handleDecline} />
                    )
                  : null}
              </View>
            )}
      </View>
    </SafeAreaView>
  );
}
