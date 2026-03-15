import type { OrgInvitation, OrgMember } from '../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, I18nManager, RefreshControl, StyleSheet } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { useModal } from '@/components/ui/modal';
import { AppRoute } from '@/core/navigation/routes';
import { NoOrgEmptyState } from '../components';
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

function MemberCard({ member, onPress }: { member: OrgMember; onPress: () => void }) {
  const { t } = useTranslation();
  const isTeacher = member.role === 'TEACHER';
  return (
    <Pressable
      onPress={isTeacher ? onPress : undefined}
      style={({ pressed }) => [
        styles.card,
        isTeacher && pressed && styles.cardPressed,
      ]}
      accessibilityRole={isTeacher ? 'button' : undefined}
      accessibilityLabel={member.name}
    >
      <View style={styles.memberAvatar}>
        <Ionicons name="person" size={18} color="#64748B" />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{member.name}</Text>
        <Text style={styles.cardMeta}>
          {member.role === 'OWNER'
            ? t('manager.teachers.roleOwner', { defaultValue: 'Owner' })
            : t('manager.teachers.roleTeacher', { defaultValue: 'Teacher' })}
          {' \u00B7 '}
          {t('manager.teachers.activeSessions', {
            defaultValue: '{{count}} active sessions',
            count: member.activeSessionsCount,
          })}
        </Text>
      </View>
      {isTeacher
        ? (
            <Ionicons
              name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
              size={18}
              color="#D1D5DB"
              style={styles.chevron}
            />
          )
        : null}
    </Pressable>
  );
}

function InvitationCard({ invitation, onPress }: { invitation: OrgInvitation; onPress: () => void }) {
  const { t } = useTranslation();
  const contact = invitation.inviteeEmail ?? invitation.inviteePhone ?? '';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, styles.cardPending, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={contact}
    >
      <View style={styles.pendingAvatar}>
        <Ionicons name="time-outline" size={18} color="#B45309" />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{contact}</Text>
        <Text style={styles.cardMeta}>
          {t('manager.teachers.pendingExpires', {
            defaultValue: 'Expires {{date}}',
            date: formatExpiryDate(invitation.expiresAt),
          })}
        </Text>
      </View>
      <Ionicons
        name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
        size={18}
        color="#D1D5DB"
        style={styles.chevron}
      />
    </Pressable>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  color = '#374151',
  danger = false,
  loading = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.actionRow,
        danger && styles.actionRowDanger,
        pressed && { backgroundColor: danger ? '#FEF2F2' : '#F9FAFB' },
        loading && { opacity: 0.6 },
      ]}
      accessibilityRole="button"
    >
      <View style={[styles.actionIcon, { backgroundColor: danger ? '#FEF2F2' : '#F3F4F6' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.actionRowLabel, { color }]}>{label}</Text>
      <Ionicons
        name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
        size={16}
        color="#D1D5DB"
      />
    </Pressable>
  );
}

// eslint-disable-next-line max-lines-per-function
function TeachersList() {
  const { t } = useTranslation();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const membersQuery = useOrgMembers(activeOrgId);
  const invitationsQuery = useOrgInvitations(activeOrgId);
  const removeMutation = useRemoveMember(activeOrgId);
  const cancelMutation = useCancelInvitation(activeOrgId);
  const resendMutation = useResendInvitation(activeOrgId);

  const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<OrgInvitation | null>(null);
  const memberSheet = useModal();
  const invitationSheet = useModal();

  const handleMemberPress = (member: OrgMember) => {
    setSelectedMember(member);
    memberSheet.present();
  };

  const handleInvitationPress = (invitation: OrgInvitation) => {
    setSelectedInvitation(invitation);
    invitationSheet.present();
  };

  const handleRemoveMember = () => {
    if (!selectedMember)
      return;
    Alert.alert(
      t('manager.teachers.removeTitle', { defaultValue: 'Remove teacher?' }),
      t('manager.teachers.removeMessage', {
        defaultValue: 'Their assigned sessions will be paused and future instances cancelled.',
      }),
      [
        { text: t('manager.common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('manager.teachers.removeConfirm', { defaultValue: 'Remove' }),
          style: 'destructive',
          onPress: () => {
            memberSheet.dismiss();
            removeMutation.mutate(selectedMember.id);
          },
        },
      ],
    );
  };

  const handleResend = () => {
    if (!selectedInvitation)
      return;
    resendMutation.mutate(selectedInvitation.id);
  };

  const handleCancel = () => {
    if (!selectedInvitation)
      return;
    Alert.alert(
      t('manager.teachers.pendingCancel', { defaultValue: 'Cancel invitation?' }),
      t('manager.teachers.cancelMessage', { defaultValue: 'This invitation will be cancelled immediately.' }),
      [
        { text: t('manager.common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('manager.teachers.pendingCancel', { defaultValue: 'Cancel invite' }),
          style: 'destructive',
          onPress: () => {
            invitationSheet.dismiss();
            cancelMutation.mutate(selectedInvitation.id);
          },
        },
      ],
    );
  };

  const onRefresh = useCallback(() => {
    membersQuery.refetch();
    invitationsQuery.refetch();
  }, [membersQuery, invitationsQuery]);

  const isRefreshing = membersQuery.isRefetching || invitationsQuery.isRefetching;

  if (membersQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-10">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (membersQuery.isError) {
    return (
      <View className="flex-1 items-center gap-3 py-10">
        <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
        <Text className="font-inter text-sm text-red-600">
          {t('manager.teachers.errorLoading', { defaultValue: 'Could not load members.' })}
        </Text>
        <Button
          variant="outline"
          size="sm"
          label={t('manager.teachers.errorRetry', { defaultValue: 'Retry' })}
          fullWidth={false}
          onPress={() => membersQuery.refetch()}
        />
      </View>
    );
  }

  const members = membersQuery.data?.data ?? [];
  const invitations = invitationsQuery.data?.data ?? [];

  return (
    <>
      <ScrollView
        contentContainerClassName="px-6 pb-8 pt-2"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {members.length === 0 && invitations.length === 0
          ? (
              <View className="items-center py-16">
                <Ionicons name="people-outline" size={40} color="#9CA3AF" />
                <Text className="font-inter mt-3 text-sm text-slate-500">
                  {t('manager.teachers.empty', { defaultValue: 'No teachers yet.' })}
                </Text>
              </View>
            )
          : null}

        {members.length > 0 && (
          <>
            <Text className="font-inter mb-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">
              {t('manager.teachers.listTitle', { defaultValue: 'Current members' })}
            </Text>
            <View className="gap-3">
              {members.map(member => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onPress={() => handleMemberPress(member)}
                />
              ))}
            </View>
          </>
        )}

        {invitations.length > 0 && (
          <>
            <Text className={`font-inter mb-3 text-xs font-semibold tracking-wider text-slate-400 uppercase ${members.length > 0 ? 'mt-6' : ''}`}>
              {t('manager.teachers.pendingTitle', { defaultValue: 'Pending invitations' })}
            </Text>
            <View className="gap-3">
              {invitations.map(invitation => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  onPress={() => handleInvitationPress(invitation)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Member actions sheet */}
      <Modal
        ref={memberSheet.ref}
        snapPoints={[140]}
        title={selectedMember?.name ?? ''}
      >
        <View style={styles.sheetContent}>
          <ActionRow
            icon="person-remove-outline"
            label={t('manager.teachers.remove', { defaultValue: 'Remove from organization' })}
            onPress={handleRemoveMember}
            color="#DC2626"
            danger
          />
        </View>
      </Modal>

      {/* Invitation actions sheet */}
      <Modal
        ref={invitationSheet.ref}
        snapPoints={[180]}
        title={selectedInvitation?.inviteeEmail ?? selectedInvitation?.inviteePhone ?? ''}
      >
        <View style={styles.sheetContent}>
          <ActionRow
            icon="send-outline"
            label={t('manager.teachers.pendingResend', { defaultValue: 'Resend invitation' })}
            onPress={handleResend}
            loading={resendMutation.isPending}
          />
          <ActionRow
            icon="close-circle-outline"
            label={t('manager.teachers.pendingCancel', { defaultValue: 'Cancel invitation' })}
            onPress={handleCancel}
            color="#DC2626"
            danger
          />
        </View>
      </Modal>
    </>
  );
}

export function TeachersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const setActiveOrgId = useManagerStore.use.setActiveOrgId();
  const organizationsQuery = useOrganizations();

  useEffect(() => {
    if (!activeOrgId && organizationsQuery.data?.data[0]) {
      setActiveOrgId(organizationsQuery.data.data[0].id);
    }
  }, [activeOrgId, organizationsQuery.data, setActiveOrgId]);

  if (!activeOrgId) {
    return <NoOrgEmptyState />;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <View className="flex-row items-center justify-between px-6 pt-6 pb-2">
        <View className="flex-1">
          <Text className="font-inter text-3xl font-semibold text-slate-900">
            {t('manager.teachers.title', { defaultValue: 'Teachers' })}
          </Text>
          <Text className="font-inter mt-1 text-base text-slate-500">
            {t('manager.teachers.subtitle', {
              defaultValue: 'Invite teachers by phone or email, then remove them cleanly when responsibilities change.',
            })}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push(AppRoute.manager.teacherInvite)}
          className="ms-3 size-10 items-center justify-center rounded-full bg-[#3B82F6]"
          accessibilityLabel={t('manager.teachers.inviteTitle', { defaultValue: 'Invite teacher' })}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={24} color="white" />
        </Pressable>
      </View>

      <TeachersList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPending: { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' },
  cardPressed: { opacity: 0.85 },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 3 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  cardMeta: { fontSize: 13, color: '#64748B' },
  chevron: { flexShrink: 0 },
  // Actions sheet
  sheetContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 4 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  actionRowDanger: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#F3F4F6' },
  actionRowLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
