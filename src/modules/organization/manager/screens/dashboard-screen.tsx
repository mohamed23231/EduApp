/**
 * DashboardScreen — Manager
 * Dark obsidian + lime design system.
 * Hero, 2-column tiles, CTA, teacher leaderboard,
 * quick actions, onboarding wizard, trial banner, today's sessions.
 */

import type { TextStyle, ViewStyle } from 'react-native';
import type { OrgSessionInstance, OrgTeacherStatsItem } from '../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, RefreshControl, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, ErrorState, ScrollView, Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { Modal, useModal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast-host';
import { AppRoute } from '@/core/navigation/routes';
import { SUPPORT_WHATSAPP_URL } from '@/shared/constants/support';
import { OnboardingWizard, TrialExpiredBanner } from '../components';
import { AttendanceHero } from '../components/dashboard/attendance-hero';
import { TeacherLeaderboard } from '../components/dashboard/teacher-leaderboard';
import { TodayTiles } from '../components/dashboard/today-tiles';
import { useCloseSession, useOrganization, useOrganizations, useOrgInstances, useOrgStats, useStartSession } from '../hooks';
import { useManagerStore } from '../store/manager-store';

function QuickActionCard({
  icon,
  label,
  onPress,
  iconBg,
  iconColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  iconBg: string;
  iconColor: string;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(0.95, { damping: 15 });
  };
  const handlePressOut = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
        accessibilityRole="button"
      >
        <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        <Text style={styles.actionLabel} numberOfLines={2}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function QuickActions({
  onAddStudent,
  onCreateSession,
  onInviteTeacher,
  t,
}: {
  onAddStudent: () => void;
  onCreateSession: () => void;
  onInviteTeacher: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <View style={styles.actionsGrid}>
      <QuickActionCard
        icon="person-add-outline"
        label={t('manager.dashboard.quickAddStudent', { defaultValue: 'Add student' })}
        onPress={onAddStudent}
        iconBg={colors.brand.primaryGlow}
        iconColor={colors.brand.primaryDeep}
      />
      <QuickActionCard
        icon="calendar-outline"
        label={t('manager.dashboard.quickNewSession', { defaultValue: 'New session' })}
        onPress={onCreateSession}
        iconBg={colors.semantic.presentSoft}
        iconColor={colors.semantic.presentInk}
      />
      <QuickActionCard
        icon="mail-outline"
        label={t('manager.dashboard.quickInvite', { defaultValue: 'Invite' })}
        onPress={onInviteTeacher}
        iconBg={colors.semantic.excusedSoft}
        iconColor={colors.semantic.excusedInk}
      />
    </View>
  );
}

/** Stripe color per session state — matches teacher card pattern. */
const STATE_STRIPE: Record<string, string> = {
  DRAFT: colors.semantic.excused,
  ACTIVE: colors.semantic.present,
  CLOSED: colors.neutral.dim,
  CANCELLED: colors.neutral.dim,
};

/** Badge style per session state. */
const STATE_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  DRAFT: { bg: colors.semantic.excusedSoft, text: colors.semantic.excusedInk, dot: colors.semantic.excused },
  ACTIVE: { bg: colors.semantic.presentSoft, text: colors.semantic.presentInk, dot: colors.semantic.present },
  CLOSED: { bg: colors.neutral.cardWarm, text: colors.neutral.inkSoft, dot: colors.neutral.dim },
  CANCELLED: { bg: colors.semantic.excusedSoft, text: colors.semantic.excusedInk, dot: colors.semantic.excused },
};

function TodaySessionCard({
  instance,
  onPress,
  onStart,
  onMarkAttendance,
  onClose,
  isStarting,
  isClosing,
  t,
}: {
  instance: OrgSessionInstance;
  onPress: () => void;
  onStart: (id: string) => void;
  onMarkAttendance: (id: string) => void;
  onClose: (id: string) => void;
  isStarting: boolean;
  isClosing: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const stateKey = instance.state;
  const stripeColor = STATE_STRIPE[stateKey] ?? colors.neutral.dim;
  const badge = STATE_BADGE[stateKey] ?? STATE_BADGE.CLOSED;
  const studentCount = instance.studentCount ?? instance.students?.length ?? 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.sessionCard, pressed && styles.sessionCardPressed]}
      accessibilityRole="button"
      accessibilityLabel={instance.subject}
    >
      <View style={[styles.sessionStripe, { backgroundColor: stripeColor }]} />
      <View style={styles.sessionBody}>
        <View style={styles.sessionTopRow}>
          <Text style={styles.sessionSubject} numberOfLines={1}>{instance.subject}</Text>
          <View style={[styles.stateBadge, { backgroundColor: badge.bg }]}>
            <View style={[styles.stateBadgeDot, { backgroundColor: badge.dot }]} />
            <Text style={[styles.stateBadgeText, { color: badge.text }]}>
              {t(`manager.sessionDetail.instanceState.${stateKey.toLowerCase()}`, { defaultValue: instance.state })}
            </Text>
          </View>
        </View>

        <View style={styles.sessionMeta}>
          <Ionicons name="time-outline" size={13} color={colors.neutral.dim} />
          <Text style={styles.sessionMetaText}>
            {instance.time}
            {' · '}
            {t('manager.dashboard.sessionDuration', { defaultValue: '{{minutes}} min', minutes: instance.durationMinutes })}
          </Text>
        </View>

        <View style={styles.sessionMeta}>
          <Ionicons name="person-outline" size={13} color={colors.neutral.dim} />
          <Text style={styles.sessionMetaText}>{instance.assignedTeacher.name}</Text>
          <Text style={styles.sessionDot}>·</Text>
          <Ionicons name="people-outline" size={13} color={colors.neutral.dim} />
          <Text style={styles.sessionMetaText}>
            {t('manager.dashboard.sessionStudents', { defaultValue: '{{count}} students', count: studentCount })}
          </Text>
        </View>

        {stateKey === 'DRAFT' && (
          <View style={styles.actionRow}>
            <Button
              label={t('manager.dashboard.startSession', { defaultValue: 'Start Session' })}
              onPress={() => onStart(instance.id)}
              loading={isStarting}
              size="sm"
              variant="default"
            />
          </View>
        )}

        {stateKey === 'ACTIVE' && (
          <View style={styles.activeActionsRow}>
            <Pressable
              onPress={() => onMarkAttendance(instance.id)}
              style={({ pressed }) => [styles.attendanceBtn, pressed && styles.attendanceBtnPressed]}
              accessibilityRole="button"
            >
              <Ionicons name="checkmark-done-outline" size={16} color={colors.neutral.white} />
              <Text style={styles.attendanceBtnText}>
                {t('manager.dashboard.markAttendance', { defaultValue: 'Mark Attendance' })}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onClose(instance.id)}
              disabled={isClosing}
              style={({ pressed }) => [styles.endBtn, pressed && styles.endBtnPressed, isClosing && styles.endBtnDisabled]}
              accessibilityRole="button"
            >
              <Ionicons name="stop-circle-outline" size={16} color={colors.semantic.absent} />
              <Text style={styles.endBtnText}>
                {isClosing ? '...' : t('manager.dashboard.endSession', { defaultValue: 'End Session' })}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function TodaySessions({
  instances,
  today,
  t,
  onOpenSession,
  onViewAll,
  onStart,
  onMarkAttendance,
  onClose,
  startingId,
  closingId,
}: {
  instances: OrgSessionInstance[];
  today: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
  onOpenSession: (templateId: string) => void;
  onViewAll: () => void;
  onStart: (id: string) => void;
  onMarkAttendance: (id: string) => void;
  onClose: (id: string) => void;
  startingId: string | null;
  closingId: string | null;
}) {
  const todayInstances = instances.filter(i => i.date === today);

  return (
    <>
      <View style={styles.sectionHeader}>
        <Ionicons name="today-outline" size={14} color={colors.neutral.inkMuted} />
        <Text style={styles.sectionTitle}>
          {t('manager.dashboard.todayTitle', { defaultValue: 'Today\'s sessions' })}
        </Text>
        <Pressable onPress={onViewAll} style={styles.viewAllBtn} accessibilityRole="button">
          <Text style={styles.viewAllText}>
            {t('manager.dashboard.viewAll', { defaultValue: 'View all' })}
          </Text>
        </Pressable>
      </View>
      {todayInstances.length === 0
        ? (
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-outline" size={32} color={colors.neutral.border} />
              <Text style={styles.emptyText}>
                {t('manager.dashboard.noSessions', { defaultValue: 'No sessions scheduled for today yet.' })}
              </Text>
            </View>
          )
        : (
            <View style={styles.sessionsList}>
              {todayInstances.map(instance => (
                <TodaySessionCard
                  key={instance.id}
                  instance={instance}
                  onPress={() => onOpenSession(instance.templateId)}
                  onStart={onStart}
                  onMarkAttendance={onMarkAttendance}
                  onClose={onClose}
                  isStarting={startingId === instance.id}
                  isClosing={closingId === instance.id}
                  t={t}
                />
              ))}
            </View>
          )}
    </>
  );
}

function EmptyOrgState({
  t,
  onSetup,
}: {
  t: (key: string, opts?: Record<string, unknown>) => string;
  onSetup: () => void;
}) {
  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.neutral.paper }}>
      <View style={styles.emptyOrgHero}>
        <Ionicons name="business-outline" size={48} color="rgba(255,255,255,0.6)" />
        <Text style={styles.emptyOrgTitle}>
          {t('manager.dashboard.emptyTitle', { defaultValue: 'No organization yet' })}
        </Text>
        <Text style={styles.emptyOrgBody}>
          {t('manager.dashboard.emptyCopy', { defaultValue: 'Create your first organization to unlock the manager dashboard.' })}
        </Text>
        <Pressable
          onPress={onSetup}
          style={({ pressed }) => [styles.emptyOrgBtn, pressed && styles.emptyOrgBtnPressed]}
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.brand.primary} />
          <Text style={styles.emptyOrgBtnText}>
            {t('manager.setup.submit', { defaultValue: 'Create organization' })}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// eslint-disable-next-line max-lines-per-function
export function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const setActiveOrgId = useManagerStore.use.setActiveOrgId();
  const setOrgDetails = useManagerStore.use.setOrgDetails();
  const organizationsQuery = useOrganizations();
  const organizationQuery = useOrganization(activeOrgId);
  const stats = useOrgStats(activeOrgId, 'month');
  const today = new Date().toISOString().slice(0, 10);
  const instancesQuery = useOrgInstances(activeOrgId, { date: today });
  const startMutation = useStartSession(activeOrgId);
  const closeMutation = useCloseSession(activeOrgId);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [closePendingId, setClosePendingId] = useState<string | null>(null);
  const trialModal = useModal();
  const closeModal = useModal();

  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const onRefresh = useCallback(async () => {
    setIsManualRefresh(true);
    try {
      await Promise.all([
        organizationQuery.refetch(),
        stats.overview.refetch(),
        stats.teachers.refetch(),
        instancesQuery.refetch(),
      ]);
    }
    finally {
      setIsManualRefresh(false);
    }
  }, [organizationQuery, stats.overview, stats.teachers, instancesQuery]);

  const showMutationError = useCallback(
    (error: unknown) => {
      const apiError = error as { response?: { data?: { message?: string; statusCode?: number } } };
      const apiMessage = apiError?.response?.data?.message;
      const statusCode = apiError?.response?.data?.statusCode;
      const isExpired = statusCode === 403 && (apiMessage?.includes('expired') === true || apiMessage?.includes('read-only') === true);
      if (isExpired) {
        trialModal.present();
        return;
      }
      toast.show({
        message: apiMessage ?? t('manager.sessionDetail.actionError', { defaultValue: 'This action could not be completed. Please try again.' }),
        kind: 'error',
      });
    },
    [t, toast, trialModal],
  );

  const handleStartSession = useCallback(
    (instanceId: string) => {
      setStartingId(instanceId);
      startMutation.mutate(instanceId, {
        onSettled: () => setStartingId(null),
        onError: showMutationError,
      });
    },
    [startMutation, showMutationError],
  );

  const handleMarkAttendance = useCallback(
    (instanceId: string) => {
      router.push(AppRoute.manager.attendance(instanceId));
    },
    [router],
  );

  const handleCloseSession = useCallback(
    (instanceId: string) => {
      setClosePendingId(instanceId);
      closeModal.present();
    },
    [closeModal],
  );

  const handleCloseConfirm = useCallback(() => {
    if (closePendingId === null)
      return;
    const instanceId = closePendingId;
    closeModal.dismiss();
    setClosingId(instanceId);
    closeMutation.mutate(instanceId, {
      onSettled: () => setClosingId(null),
      onError: showMutationError,
      onSuccess: () => {
        toast.show({
          message: t('manager.dashboard.sessionClosed', { defaultValue: 'Session closed — absent students marked.' }),
          kind: 'success',
          action: {
            label: t('manager.dashboard.viewAttendance', { defaultValue: 'View' }),
            onPress: () => router.push(AppRoute.manager.attendance(instanceId)),
          },
        });
      },
    });
    setClosePendingId(null);
  }, [closePendingId, closeModal, closeMutation, showMutationError, toast, t, router]);

  useEffect(() => {
    if (!activeOrgId && organizationsQuery.data?.data[0]) {
      setActiveOrgId(organizationsQuery.data.data[0].id);
    }
  }, [activeOrgId, organizationsQuery.data, setActiveOrgId]);

  useEffect(() => {
    if (organizationQuery.data) {
      setOrgDetails(organizationQuery.data);
    }
  }, [organizationQuery.data, setOrgDetails]);

  if (organizationsQuery.data && organizationsQuery.data.data.length === 0) {
    return <EmptyOrgState t={t} onSetup={() => router.push(AppRoute.manager.setup)} />;
  }

  if (organizationQuery.isLoading || stats.overview.isLoading || instancesQuery.isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </SafeAreaView>
    );
  }

  if (organizationQuery.isError || stats.overview.isError || instancesQuery.isError) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center" style={{ backgroundColor: colors.neutral.paper }}>
        <ErrorState
          title={t('manager.dashboard.errorTitle', { defaultValue: 'Could not load dashboard' })}
          body={t('manager.dashboard.errorBody', { defaultValue: 'Something went wrong loading your organization. Please try again.' })}
          action={{ label: t('manager.common.retry', { defaultValue: 'Retry' }), onPress: onRefresh }}
        />
      </SafeAreaView>
    );
  }

  const organization = organizationQuery.data;
  const overview = stats.overview.data;
  const teacherStats = stats.teachers.data?.data ?? [] as OrgTeacherStatsItem[];
  // At-risk = students absent today (absentToday is the clearest proxy from overview)
  const atRiskCount = overview?.absentToday ?? 0;
  // Upcoming = scheduled sessions that haven't started yet (todaySessions minus runningNow)
  const upcomingCount = Math.max(0, (overview?.todaySessions ?? 0) - (overview?.runningNow ?? 0));

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.neutral.paper }}>
      {/* Screen header */}
      <View style={styles.screenHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {organization?.name ?? t('manager.more.roleManager', { defaultValue: 'Manager' })}
          </Text>
          <Text style={styles.headerTitle}>
            {t('manager.dashboard.headerToday', { defaultValue: 'Today' })}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isManualRefresh} onRefresh={onRefresh} />}
      >
        {/* Attendance hero card */}
        <Animated.View entering={FadeInDown.delay(0).duration(350)}>
          <AttendanceHero
            attendanceRate={overview?.averageAttendanceRate ?? 0}
            presentCount={(overview?.activeStudents ?? 0) - atRiskCount}
            absentCount={atRiskCount}
            runningNow={overview?.runningNow ?? 0}
            onPress={() => router.push(AppRoute.manager.sessions)}
          />
        </Animated.View>

        {/* 2-column tiles */}
        <Animated.View entering={FadeInDown.delay(60).duration(350)}>
          <TodayTiles
            todaySessions={overview?.todaySessions ?? 0}
            runningNow={overview?.runningNow ?? 0}
            upcomingCount={upcomingCount}
            atRiskCount={atRiskCount}
          />
        </Animated.View>

        {/* CTA: Create a session */}
        <Animated.View entering={FadeInDown.delay(100).duration(350)} style={styles.ctaWrap}>
          <Pressable
            onPress={() => router.push(AppRoute.manager.sessionCreate)}
            style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
            accessibilityRole="button"
          >
            <Ionicons name="add" size={22} color={colors.neutral.card} />
            <Text style={styles.ctaBtnText}>
              {t('manager.dashboard.cta.createSession', { defaultValue: 'Create a session' })}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Quick actions (secondary row: add student, invite) */}
        <Animated.View entering={FadeInDown.delay(140).duration(350)}>
          <QuickActions
            onAddStudent={() => router.push(AppRoute.manager.studentCreate)}
            onCreateSession={() => router.push(AppRoute.manager.sessionCreate)}
            onInviteTeacher={() => router.push(AppRoute.manager.teacherInvite)}
            t={t}
          />
        </Animated.View>

        {/* Teacher leaderboard */}
        {teacherStats.length > 0 && (
          <Animated.View entering={FadeInDown.delay(180).duration(350)}>
            <TeacherLeaderboard
              teachers={teacherStats}
              onViewAll={() => router.push(AppRoute.manager.teachers)}
            />
          </Animated.View>
        )}

        {/* Trial expired banner */}
        {organization?.entitlementSource === 'expired' && (
          <Animated.View entering={FadeInDown.delay(200).duration(350)} style={styles.bannerWrap}>
            <TrialExpiredBanner visible onCreateNewOrg={() => router.push(AppRoute.manager.setup)} />
          </Animated.View>
        )}

        {/* Onboarding wizard */}
        {organization && (organization.currentStudents === 0 || organization.currentSessions === 0) && (
          <Animated.View entering={FadeInDown.delay(240).duration(350)} style={styles.wizardWrap}>
            <OnboardingWizard steps={[
              { title: t('manager.wizard.steps.students.title', { defaultValue: 'Add your first student' }), description: t('manager.wizard.steps.students.copy', { defaultValue: 'Create at least one student so sessions and attendance have real rosters.' }), ctaLabel: t('manager.wizard.steps.students.cta', { defaultValue: 'Open students' }), onPress: () => router.push(AppRoute.manager.students), done: organization.currentStudents > 0 },
              { title: t('manager.wizard.steps.teachers.title', { defaultValue: 'Invite or assign a teacher' }), description: t('manager.wizard.steps.teachers.copy', { defaultValue: 'Invite teachers now, or assign sessions to yourself as the owner to get started quickly.' }), ctaLabel: t('manager.wizard.steps.teachers.cta', { defaultValue: 'Open teachers' }), onPress: () => router.push(AppRoute.manager.teachers), done: teacherStats.length > 0 },
              { title: t('manager.wizard.steps.sessions.title', { defaultValue: 'Create the first session' }), description: t('manager.wizard.steps.sessions.copy', { defaultValue: 'Once students and a teacher are ready, schedule the recurring session template.' }), ctaLabel: t('manager.wizard.steps.sessions.cta', { defaultValue: 'Open sessions' }), onPress: () => router.push(AppRoute.manager.sessions), done: organization.currentSessions > 0 },
            ]}
            />
          </Animated.View>
        )}

        {/* Today's sessions list */}
        <Animated.View entering={FadeInDown.delay(280).duration(350)}>
          <TodaySessions
            instances={instancesQuery.data?.data ?? []}
            today={today}
            t={t}
            onOpenSession={templateId => router.push(AppRoute.manager.sessionDetail(templateId))}
            onViewAll={() => router.push(AppRoute.manager.sessions)}
            onStart={handleStartSession}
            onMarkAttendance={handleMarkAttendance}
            onClose={handleCloseSession}
            startingId={startingId}
            closingId={closingId}
          />
        </Animated.View>
      </ScrollView>

      {/* Trial expired sheet */}
      <Modal ref={trialModal.ref} snapPoints={['32%']} title={t('manager.trial.expiredTitle', { defaultValue: 'Trial expired' })}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
          <Text style={{ fontSize: 14, color: colors.neutral.inkMuted, lineHeight: 20 }}>
            {t('manager.trial.expiredMessage', { defaultValue: 'This organization is read-only. Contact support to activate a subscription.' })}
          </Text>
          <Pressable
            onPress={() => {
              trialModal.dismiss();
              router.push(AppRoute.manager.setup);
            }}
            style={({ pressed }) => ({ padding: 14, borderRadius: 12, backgroundColor: pressed ? colors.neutral.cardWarm : colors.neutral.card, borderWidth: 1, borderColor: colors.neutral.rule })}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.neutral.ink, textAlign: 'center' }}>
              {t('manager.trial.createNewOrg', { defaultValue: 'Create new org' })}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => { void Linking.openURL(SUPPORT_WHATSAPP_URL); }}
            style={{ padding: 14, borderRadius: 12, backgroundColor: colors.brand.primary }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.neutral.white, textAlign: 'center' }}>
              {t('manager.trial.contactSupport', { defaultValue: 'Contact support' })}
            </Text>
          </Pressable>
        </View>
      </Modal>

      {/* Close session confirm sheet */}
      <Modal ref={closeModal.ref} snapPoints={['30%']} title={t('manager.sessionDetail.closeWarningTitle', { defaultValue: 'Close session' })}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
          <Text style={{ fontSize: 14, color: colors.neutral.inkMuted, lineHeight: 20 }}>
            {t('manager.sessionDetail.closeWarning', { count: 0, defaultValue: 'Unmarked students will be auto-marked as absent.' })}
          </Text>
          <Pressable
            onPress={handleCloseConfirm}
            style={({ pressed }) => ({ padding: 14, borderRadius: 12, backgroundColor: pressed ? colors.semantic.absentSoft : colors.semantic.absent })}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.neutral.white, textAlign: 'center' }}>
              {t('manager.sessionDetail.closeConfirm', { defaultValue: 'Confirm' })}
            </Text>
          </Pressable>
          <Pressable
            onPress={closeModal.dismiss}
            style={({ pressed }) => ({ padding: 14, borderRadius: 12, backgroundColor: pressed ? colors.neutral.cardWarm : colors.neutral.card, borderWidth: 1, borderColor: colors.neutral.rule })}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.neutral.ink, textAlign: 'center' }}>
              {t('manager.common.cancel', { defaultValue: 'Cancel' })}
            </Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = {
  // Layout
  container: { flex: 1, backgroundColor: colors.neutral.paper },
  loadingContainer: { flex: 1, backgroundColor: colors.neutral.paper, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 120 },

  // Screen header
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerSubtitle: { fontSize: 12, color: colors.neutral.inkMuted, fontWeight: '600', marginBottom: 1 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.neutral.ink, letterSpacing: -0.5 },
  // CTA button
  ctaWrap: { paddingHorizontal: 16, marginTop: 12 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.neutral.ink,
    height: 56,
    borderRadius: 18,
  },
  ctaBtnPressed: { opacity: 0.85 },
  ctaBtnText: { fontSize: 15, fontWeight: '700', color: colors.neutral.card },

  // Quick actions
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  actionCard: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: colors.neutral.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral.rule,
  },
  actionCardPressed: { opacity: 0.8 },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 12, fontWeight: '600', color: colors.neutral.ink, textAlign: 'center' },

  // Banners & wizard
  bannerWrap: { paddingHorizontal: 16, paddingTop: 4 },
  wizardWrap: { paddingHorizontal: 16, paddingTop: 8 },

  // Section header (today's sessions)
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  viewAllBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  viewAllText: { fontSize: 13, fontWeight: '600', color: colors.brand.primary },

  // Session cards
  sessionsList: { paddingHorizontal: 16, gap: 10 },
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.neutral.rule,
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sessionCardPressed: { opacity: 0.85 },
  sessionStripe: {
    width: 4,
    borderTopStartRadius: 14,
    borderBottomStartRadius: 14,
  },
  sessionBody: { flex: 1, padding: 14, gap: 6 },
  sessionTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sessionSubject: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.neutral.ink },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  stateBadgeDot: { width: 6, height: 6, borderRadius: 3 },
  stateBadgeText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  sessionMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sessionMetaText: { fontSize: 13, color: colors.neutral.inkMuted },
  sessionDot: { fontSize: 13, color: colors.neutral.dim, marginHorizontal: 2 },
  actionRow: { marginTop: 8, alignSelf: 'flex-start' },
  activeActionsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  attendanceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.semantic.present,
    borderRadius: 10,
  },
  attendanceBtnPressed: { backgroundColor: colors.semantic.presentInk },
  attendanceBtnText: { fontSize: 13, fontWeight: '600', color: colors.neutral.white },
  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.semantic.absentSoft,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.semantic.absentSoft,
  },
  endBtnPressed: { opacity: 0.85 },
  endBtnDisabled: { opacity: 0.5 },
  endBtnText: { fontSize: 13, fontWeight: '600', color: colors.semantic.absent },

  // Empty state
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyText: { fontSize: 14, color: colors.neutral.dim, textAlign: 'center' },

  // Empty org
  emptyOrgHero: {
    flex: 1,
    backgroundColor: colors.neutral.ink,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyOrgTitle: { fontSize: 24, fontWeight: '800', color: colors.neutral.card, textAlign: 'center' },
  emptyOrgBody: { fontSize: 15, color: colors.neutral.dim, textAlign: 'center', lineHeight: 22 },
  emptyOrgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.neutral.card,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyOrgBtnPressed: { opacity: 0.85 },
  emptyOrgBtnText: { fontSize: 15, fontWeight: '700', color: colors.brand.primary },
} satisfies Record<string, ViewStyle | TextStyle>;
