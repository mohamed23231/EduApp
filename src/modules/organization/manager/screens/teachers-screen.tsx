import type { OrgInvitation } from '../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { InviteTeacherModal } from '../components';
import {
  useCancelInvitation,
  useOrganizations,
  useOrgInvitations,
  useOrgMembers,
  useRemoveMember,
  useResendInvitation,
} from '../hooks';
import { useManagerStore } from '../store/manager-store';

function formatExpiryDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function InvitationCard({
  invitation,
  onResend,
  onCancel,
  resendLoading,
  cancelLoading,
}: {
  invitation: OrgInvitation;
  onResend: () => void;
  onCancel: () => void;
  resendLoading: boolean;
  cancelLoading: boolean;
}) {
  const { t } = useTranslation();
  const contact = invitation.inviteeEmail ?? invitation.inviteePhone ?? '';
  return (
    <View className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
      <Text className="font-inter text-base font-semibold text-slate-900">{contact}</Text>
      <Text className="font-inter mt-1 text-sm text-slate-500">
        {t('manager.teachers.pendingExpires', { date: formatExpiryDate(invitation.expiresAt) })}
      </Text>
      <View className="mt-3 flex-row gap-3">
        <Button variant="outline" size="sm" label={t('manager.teachers.pendingResend')} fullWidth={false} loading={resendLoading} onPress={onResend} />
        <Button variant="destructive" size="sm" label={t('manager.teachers.pendingCancel')} fullWidth={false} loading={cancelLoading} onPress={onCancel} />
      </View>
    </View>
  );
}

function MembersList() {
  const { t } = useTranslation();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const membersQuery = useOrgMembers(activeOrgId);
  const removeMutation = useRemoveMember(activeOrgId);

  const confirmRemove = (memberId: string) => {
    Alert.alert(
      t('manager.teachers.removeTitle'),
      t('manager.teachers.removeMessage'),
      [
        { text: t('manager.common.cancel'), style: 'cancel' },
        { text: t('manager.teachers.removeConfirm'), style: 'destructive', onPress: () => removeMutation.mutate(memberId) },
      ],
    );
  };

  if (membersQuery.isLoading) {
    return (
      <View className="mt-5 items-center py-10">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (membersQuery.isError) {
    return (
      <View className="mt-5 items-center gap-3 py-6">
        <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
        <Text className="font-inter text-sm text-red-600">{t('manager.teachers.errorLoading')}</Text>
        <Button variant="outline" size="sm" label={t('manager.teachers.errorRetry')} fullWidth={false} onPress={() => membersQuery.refetch()} />
      </View>
    );
  }

  return (
    <View className="mt-5 rounded-[28px] bg-white p-5">
      <Text className="font-inter text-lg font-semibold text-slate-900">
        {t('manager.teachers.listTitle')}
      </Text>
      <View className="mt-4 gap-3">
        {(membersQuery.data?.data ?? []).map(member => (
          <View key={member.id} className="rounded-2xl border border-slate-200 p-4">
            <Text className="font-inter text-base font-semibold text-slate-900">{member.name}</Text>
            <Text className="font-inter mt-1 text-sm text-slate-500">
              {member.role}
              {' \u00B7 '}
              {t('manager.teachers.activeSessions', { count: member.activeSessionsCount })}
            </Text>
            {member.role === 'TEACHER'
              ? (
                  <Button className="mt-3" variant="destructive" size="sm" label={t('manager.teachers.remove')} fullWidth={false} loading={removeMutation.isPending} onPress={() => confirmRemove(member.id)} />
                )
              : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function PendingInvitationsList() {
  const { t } = useTranslation();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const invitationsQuery = useOrgInvitations(activeOrgId);
  const cancelMutation = useCancelInvitation(activeOrgId);
  const resendMutation = useResendInvitation(activeOrgId);

  return (
    <View className="mt-5 rounded-[28px] bg-white p-5">
      <Text className="font-inter text-lg font-semibold text-slate-900">
        {t('manager.teachers.pendingTitle')}
      </Text>
      {invitationsQuery.isLoading
        ? (
            <View className="mt-4 items-center py-6">
              <ActivityIndicator size="small" color="#6366F1" />
            </View>
          )
        : (
            <View className="mt-4 gap-3">
              {(invitationsQuery.data?.data ?? []).map(invitation => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  onResend={() => resendMutation.mutate(invitation.id)}
                  onCancel={() => cancelMutation.mutate(invitation.id)}
                  resendLoading={resendMutation.isPending}
                  cancelLoading={cancelMutation.isPending}
                />
              ))}
              {invitationsQuery.data && invitationsQuery.data.data.length === 0
                ? <Text className="font-inter text-sm text-slate-500">{t('manager.teachers.pendingEmpty')}</Text>
                : null}
            </View>
          )}
    </View>
  );
}

export function TeachersScreen() {
  const { t } = useTranslation();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const setActiveOrgId = useManagerStore.use.setActiveOrgId();
  const organizationsQuery = useOrganizations();

  useEffect(() => {
    if (!activeOrgId && organizationsQuery.data?.data[0]) {
      setActiveOrgId(organizationsQuery.data.data[0].id);
    }
  }, [activeOrgId, organizationsQuery.data, setActiveOrgId]);

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1e8]">
      <ScrollView contentContainerClassName="px-6 py-6">
        <Text className="font-inter text-3xl font-semibold text-slate-900">
          {t('manager.teachers.title')}
        </Text>
        <Text className="font-inter mt-2 text-base text-slate-500">
          {t('manager.teachers.subtitle')}
        </Text>
        <InviteTeacherModal />
        <MembersList />
        <PendingInvitationsList />
      </ScrollView>
    </SafeAreaView>
  );
}
