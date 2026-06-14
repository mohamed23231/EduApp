import type { OrgInvitation, OrgMember } from '../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, I18nManager, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Button,
  EmptyState,
  Modal,
  Monogram,
  Pressable,
  Text,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { useModal } from '@/components/ui/modal';
import { useMonogramTone } from '@/components/ui/monogram';
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
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function MemberRow({ member, onPress }: { member: OrgMember; onPress: () => void }) {
  const { t } = useTranslation();
  const tone = useMonogramTone(member.id);
  const isTeacher = member.role === 'TEACHER';
  return (
    <Pressable
      onPress={isTeacher ? onPress : undefined}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        backgroundColor: pressed && isTeacher ? colors.neutral.cardWarm : colors.neutral.card,
        borderWidth: 1.5,
        borderColor: colors.neutral.rule,
        borderRadius: 18,
      })}
      accessibilityRole={isTeacher ? 'button' : undefined}
      accessibilityLabel={member.name}
    >
      <Monogram name={member.name} tone={tone} size={44} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.neutral.ink, letterSpacing: -0.1 }}>
            {member.name}
          </Text>
          {member.role === 'OWNER' && (
            <View style={{ backgroundColor: colors.neutral.ink, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: colors.neutral.white, letterSpacing: 1 }}>
                {t('manager.teachers.roleOwner', { defaultValue: 'Owner' }).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 12, color: colors.neutral.inkMuted, fontWeight: '500' }}>
          {t('manager.teachers.activeSessions', { defaultValue: '{{count}} active sessions', count: member.activeSessionsCount })}
        </Text>
      </View>
      {isTeacher && (
        <Ionicons
          name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
          size={16}
          color={colors.neutral.inkMuted}
        />
      )}
    </Pressable>
  );
}

function InvitationRow({ invitation, onPress }: { invitation: OrgInvitation; onPress: () => void }) {
  const { t } = useTranslation();
  const contact = invitation.inviteeEmail ?? invitation.inviteePhone ?? '';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        backgroundColor: pressed ? colors.semantic.excusedSoft : colors.neutral.card,
        borderWidth: 1.5,
        borderColor: colors.semantic.excused,
        borderRadius: 18,
      })}
      accessibilityRole="button"
      accessibilityLabel={contact}
    >
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.semantic.excusedSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="time-outline" size={20} color={colors.semantic.excusedInk} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.neutral.ink, letterSpacing: -0.1 }} numberOfLines={1}>
          {contact}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ backgroundColor: colors.semantic.excusedSoft, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 }}>
            <Text style={{ fontSize: 9, fontWeight: '800', color: colors.semantic.excusedInk, letterSpacing: 1 }}>
              {t('manager.teachers.statusInvited', { defaultValue: 'INVITED' })}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.neutral.inkMuted, fontWeight: '500' }}>
            {t('manager.teachers.pendingExpires', { defaultValue: 'Expires {{date}}', date: formatExpiryDate(invitation.expiresAt) })}
          </Text>
        </View>
      </View>
      <Ionicons
        name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
        size={16}
        color={colors.neutral.inkMuted}
      />
    </Pressable>
  );
}

function ActionRow({ icon, label, onPress, color = colors.neutral.ink, danger = false, loading = false }: {
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
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderTopWidth: danger ? 1 : 0,
        borderTopColor: colors.neutral.rule,
        backgroundColor: pressed ? (danger ? colors.semantic.absentSoft : colors.neutral.cardWarm) : 'transparent',
        opacity: loading ? 0.6 : 1,
      })}
      accessibilityRole="button"
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: danger ? colors.semantic.absentSoft : colors.neutral.cardWarm, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color }}>{label}</Text>
      <Ionicons
        name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
        size={16}
        color={colors.neutral.inkMuted}
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
      t('manager.teachers.removeMessage', { defaultValue: 'Their assigned sessions will be paused and future instances cancelled.' }),
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
    if (selectedInvitation)
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

  const isRefreshing = membersQuery.isRefetching || invitationsQuery.isRefetching;
  const onRefresh = useCallback(() => {
    membersQuery.refetch();
    invitationsQuery.refetch();
  }, [membersQuery, invitationsQuery]);

  if (membersQuery.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (membersQuery.isError) {
    return (
      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
        <Ionicons name="alert-circle-outline" size={32} color={colors.semantic.absent} />
        <Text style={{ fontSize: 13, color: colors.semantic.absent }}>
          {t('manager.teachers.errorLoading', { defaultValue: 'Could not load members.' })}
        </Text>
        <Button variant="outline" size="sm" label={t('manager.teachers.errorRetry', { defaultValue: 'Retry' })} fullWidth={false} onPress={() => membersQuery.refetch()} />
      </View>
    );
  }

  const members = membersQuery.data?.data ?? [];
  const invitations = invitationsQuery.data?.data ?? [];

  return (
    <>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4, gap: 8 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {members.length === 0 && invitations.length === 0 && (
          <EmptyState
            title={t('manager.teachers.empty', { defaultValue: 'No teachers yet' })}
            body={t('manager.teachers.emptyHint', { defaultValue: 'Invite your first teacher to get started.' })}
          />
        )}

        {members.length > 0 && (
          <>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral.inkMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
              {t('manager.teachers.listTitle', { defaultValue: 'Current members' })}
            </Text>
            {members.map(member => (
              <MemberRow key={member.id} member={member} onPress={() => handleMemberPress(member)} />
            ))}
          </>
        )}

        {invitations.length > 0 && (
          <>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.neutral.inkMuted, letterSpacing: 1, textTransform: 'uppercase', marginTop: members.length > 0 ? 16 : 0, marginBottom: 4 }}>
              {t('manager.teachers.pendingTitle', { defaultValue: 'Pending invitations' })}
            </Text>
            {invitations.map(invitation => (
              <InvitationRow key={invitation.id} invitation={invitation} onPress={() => handleInvitationPress(invitation)} />
            ))}
          </>
        )}
      </ScrollView>

      <Modal ref={memberSheet.ref} snapPoints={[140]} title={selectedMember?.name ?? ''}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}>
          <ActionRow
            icon="person-remove-outline"
            label={t('manager.teachers.remove', { defaultValue: 'Remove from organization' })}
            onPress={handleRemoveMember}
            color={colors.semantic.absent}
            danger
          />
        </View>
      </Modal>

      <Modal ref={invitationSheet.ref} snapPoints={[180]} title={selectedInvitation?.inviteeEmail ?? selectedInvitation?.inviteePhone ?? ''}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 4 }}>
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
            color={colors.semantic.absent}
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
  const insets = useSafeAreaInsets();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const setActiveOrgId = useManagerStore.use.setActiveOrgId();
  const organizationsQuery = useOrganizations();
  const membersQuery = useOrgMembers(activeOrgId);
  const totalCount = membersQuery.data?.data?.length ?? 0;

  useEffect(() => {
    if (!activeOrgId && organizationsQuery.data?.data[0]) {
      setActiveOrgId(organizationsQuery.data.data[0].id);
    }
  }, [activeOrgId, organizationsQuery.data, setActiveOrgId]);

  if (!activeOrgId) {
    return <NoOrgEmptyState />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: colors.neutral.inkMuted, fontWeight: '500' }}>
            {t('manager.teachers.countLabel', { count: totalCount, defaultValue: '{{count}} teachers' })}
          </Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.neutral.ink, letterSpacing: -0.5, marginTop: 2 }}>
            {t('manager.teachers.title', { defaultValue: 'Team' })}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push(AppRoute.manager.teacherInvite)}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: pressed ? colors.brand.primaryDeep : colors.brand.primary,
            alignItems: 'center',
            justifyContent: 'center',
          })}
          accessibilityLabel={t('manager.teachers.inviteTitle', { defaultValue: 'Invite teacher' })}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={24} color={colors.neutral.ink} />
        </Pressable>
      </View>

      <TeachersList />
    </View>
  );
}
