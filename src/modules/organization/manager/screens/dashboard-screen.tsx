/**
 * DashboardScreen — Manager
 * Blue hero with greeting + org stats, animated quick actions,
 * info bar, today's sessions, onboarding wizard, and trial banner.
 */

import type { OrgSessionInstance, OrgTeacherStatsItem } from '../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, ScrollView, Text } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { OnboardingWizard, TrialExpiredBanner } from '../components';
import { useOrganization, useOrganizations, useOrgInstances, useOrgStats } from '../hooks';
import { useManagerStore } from '../store/manager-store';

const GENERATED_PHONE_EMAIL_DOMAIN = '@phone-generated.privatedu';

function isGeneratedPhoneEmail(email: string | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(GENERATED_PHONE_EMAIL_DOMAIN);
}

function getFirstName(
  fullName: string | undefined,
  email: string | undefined,
  fallback: string,
): string {
  if (fullName?.trim()) {
    const [firstPart] = fullName.trim().split(/\s+/);
    return firstPart || fullName.trim();
  }
  if (email && !isGeneratedPhoneEmail(email)) {
    const [localPart] = email.split('@');
    if (localPart)
      return localPart;
  }
  return fallback;
}

function getGreeting(t: (key: string, opts?: Record<string, unknown>) => string) {
  const hour = new Date().getHours();
  if (hour < 12)
    return t('manager.dashboard.goodMorning', { defaultValue: 'Good morning' });
  if (hour < 17)
    return t('manager.dashboard.goodAfternoon', { defaultValue: 'Good afternoon' });
  return t('manager.dashboard.goodEvening', { defaultValue: 'Good evening' });
}

function DashboardHero({
  firstName,
  orgName,
  students,
  todayCount,
  runningCount,
  t,
}: {
  firstName: string;
  orgName: string;
  students: number;
  todayCount: number;
  runningCount: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroTop}>
        <View style={styles.heroLeft}>
          <Text style={styles.greetingText}>{getGreeting(t)}</Text>
          <Text style={styles.heroName} numberOfLines={1}>{firstName}</Text>
          {orgName
            ? <Text style={styles.orgNameText} numberOfLines={1}>{orgName}</Text>
            : null}
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{firstName[0]?.toUpperCase() ?? '?'}</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{students}</Text>
          <Text style={styles.statLabel}>{t('manager.dashboard.cards.students', { defaultValue: 'Students' })}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{todayCount}</Text>
          <Text style={styles.statLabel}>{t('manager.dashboard.cards.todaySessions', { defaultValue: 'Today' })}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{runningCount}</Text>
          <Text style={styles.statLabel}>{t('manager.dashboard.cards.runningNow', { defaultValue: 'Running now' })}</Text>
        </View>
      </View>
    </View>
  );
}

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
        iconBg="#EDE9FE"
        iconColor="#7C3AED"
      />
      <QuickActionCard
        icon="calendar-outline"
        label={t('manager.dashboard.quickNewSession', { defaultValue: 'New session' })}
        onPress={onCreateSession}
        iconBg="#DBEAFE"
        iconColor="#2563EB"
      />
      <QuickActionCard
        icon="mail-outline"
        label={t('manager.dashboard.quickInvite', { defaultValue: 'Invite' })}
        onPress={onInviteTeacher}
        iconBg="#FEF3C7"
        iconColor="#D97706"
      />
    </View>
  );
}

function InfoBar({
  absentCount,
  teacherCount,
  t,
}: {
  absentCount: number;
  teacherCount: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <View style={styles.infoBar}>
      <View style={styles.infoItem}>
        <Ionicons name="alert-circle" size={14} color={absentCount > 0 ? '#DC2626' : '#9CA3AF'} />
        <Text style={[styles.infoText, absentCount > 0 && styles.infoTextAlert]}>
          {t('manager.dashboard.infoAbsent', { defaultValue: '{{count}} absent today', count: absentCount })}
        </Text>
      </View>
      <View style={styles.infoDot} />
      <View style={styles.infoItem}>
        <Ionicons name="people" size={14} color="#6B7280" />
        <Text style={styles.infoText}>
          {t('manager.dashboard.infoTeachers', { defaultValue: '{{count}} teachers', count: teacherCount })}
        </Text>
      </View>
    </View>
  );
}

const SESSION_STATE_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#F1F5F9', text: '#475569' },
  active: { bg: '#DCFCE7', text: '#166534' },
  closed: { bg: '#FEE2E2', text: '#991B1B' },
  cancelled: { bg: '#FEF3C7', text: '#92400E' },
};

function TodaySessionCard({
  instance,
  onPress,
  t,
}: {
  instance: OrgSessionInstance;
  onPress: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const stateKey = instance.state.toLowerCase();
  const stateStyle = SESSION_STATE_STYLES[stateKey] ?? SESSION_STATE_STYLES.draft;
  const studentCount = instance.studentCount ?? instance.students?.length ?? 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.sessionCard, pressed && styles.sessionCardPressed]}
      accessibilityRole="button"
      accessibilityLabel={instance.subject}
    >
      <View style={styles.sessionAccent} />
      <View style={styles.sessionBody}>
        <View style={styles.sessionTopRow}>
          <Text style={styles.sessionSubject} numberOfLines={1}>{instance.subject}</Text>
          <View style={[styles.stateBadge, { backgroundColor: stateStyle.bg }]}>
            <Text style={[styles.stateBadgeText, { color: stateStyle.text }]}>
              {t(`manager.sessionDetail.instanceState.${stateKey}`, { defaultValue: instance.state })}
            </Text>
          </View>
        </View>
        <View style={styles.sessionMeta}>
          <Ionicons name="time-outline" size={13} color="#6B7280" />
          <Text style={styles.sessionMetaText}>
            {instance.time}
            {' \u00B7 '}
            {t('manager.dashboard.sessionDuration', { defaultValue: '{{minutes}} min', minutes: instance.durationMinutes })}
          </Text>
        </View>
        <View style={styles.sessionMeta}>
          <Ionicons name="person-outline" size={13} color="#9CA3AF" />
          <Text style={styles.sessionMetaText}>{instance.assignedTeacher.name}</Text>
          <Text style={styles.sessionDot}>{'\u00B7'}</Text>
          <Ionicons name="people-outline" size={13} color="#9CA3AF" />
          <Text style={styles.sessionMetaText}>
            {t('manager.dashboard.sessionStudents', { defaultValue: '{{count}} students', count: studentCount })}
          </Text>
        </View>
      </View>
      <Ionicons
        name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
        size={18}
        color="#D1D5DB"
        style={styles.sessionChevron}
      />
    </Pressable>
  );
}

function TodaySessions({
  instances,
  today,
  t,
  onOpenSession,
  onViewAll,
}: {
  instances: OrgSessionInstance[];
  today: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
  onOpenSession: (templateId: string) => void;
  onViewAll: () => void;
}) {
  const todayInstances = instances.filter(i => i.date === today);

  return (
    <>
      <View style={styles.sectionHeader}>
        <Ionicons name="today-outline" size={14} color="#6B7280" />
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
              <Ionicons name="calendar-outline" size={32} color="#D1D5DB" />
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
    <SafeAreaView edges={['top']} style={styles.container}>
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
          <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
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
  const user = useAuthStore.use.user();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const setActiveOrgId = useManagerStore.use.setActiveOrgId();
  const setOrgDetails = useManagerStore.use.setOrgDetails();
  const organizationsQuery = useOrganizations();
  const organizationQuery = useOrganization(activeOrgId);
  const stats = useOrgStats(activeOrgId, 'month');
  const today = new Date().toISOString().slice(0, 10);
  const instancesQuery = useOrgInstances(activeOrgId, { date: today });

  const onRefresh = useCallback(() => {
    organizationQuery.refetch();
    stats.overview.refetch();
    stats.teachers.refetch();
    instancesQuery.refetch();
  }, [organizationQuery, stats.overview, stats.teachers, instancesQuery]);

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
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  const organization = organizationQuery.data;
  const overview = stats.overview.data;
  const teacherStats = stats.teachers.data?.data ?? [] as OrgTeacherStatsItem[];
  const isRefreshing = organizationQuery.isRefetching || stats.overview.isRefetching || instancesQuery.isRefetching;
  const firstName = getFirstName(user?.fullName, user?.email, t('manager.more.roleManager', { defaultValue: 'Manager' }));

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Animated.View entering={FadeInDown.delay(0).duration(350)}>
        <DashboardHero
          firstName={firstName}
          orgName={organization?.name ?? ''}
          students={overview?.activeStudents ?? 0}
          todayCount={overview?.todaySessions ?? 0}
          runningCount={overview?.runningNow ?? 0}
          t={t}
        />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(350)}>
          <QuickActions
            onAddStudent={() => router.push(AppRoute.manager.studentCreate)}
            onCreateSession={() => router.push(AppRoute.manager.sessionCreate)}
            onInviteTeacher={() => router.push(AppRoute.manager.teacherInvite)}
            t={t}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(350)}>
          <InfoBar
            absentCount={overview?.absentToday ?? 0}
            teacherCount={teacherStats.length}
            t={t}
          />
        </Animated.View>

        {organization?.entitlementSource === 'expired' && (
          <Animated.View entering={FadeInDown.delay(200).duration(350)} style={styles.bannerWrap}>
            <TrialExpiredBanner visible onCreateNewOrg={() => router.push(AppRoute.manager.setup)} />
          </Animated.View>
        )}

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

        <Animated.View entering={FadeInDown.delay(280).duration(350)}>
          <TodaySessions
            instances={instancesQuery.data?.data ?? []}
            today={today}
            t={t}
            onOpenSession={templateId => router.push(AppRoute.manager.sessionDetail(templateId))}
            onViewAll={() => router.push(AppRoute.manager.sessions)}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Layout
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 32 },

  // Hero
  hero: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomStartRadius: 20,
    borderBottomEndRadius: 20,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  heroLeft: { flex: 1, marginEnd: 12 },
  greetingText: { fontSize: 14, color: '#BFDBFE', fontWeight: '500', marginBottom: 2 },
  heroName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  orgNameText: { fontSize: 13, color: '#93C5FD', fontWeight: '500', marginTop: 2 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 12, color: '#BFDBFE', fontWeight: '500', marginTop: 2 },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 4,
  },

  // Quick actions
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  actionCard: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionCardPressed: { backgroundColor: '#F0F7FF', borderColor: '#BFDBFE' },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#374151', textAlign: 'center' },

  // Info bar
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 6,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  infoTextAlert: { color: '#DC2626' },
  infoDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },

  // Banners & wizard
  bannerWrap: { paddingHorizontal: 16, paddingTop: 4 },
  wizardWrap: { paddingHorizontal: 16, paddingTop: 8 },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  viewAllBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  viewAllText: { fontSize: 13, fontWeight: '600', color: '#3B82F6' },

  // Session cards
  sessionsList: { paddingHorizontal: 16, gap: 10 },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sessionCardPressed: { backgroundColor: '#F0F7FF', borderColor: '#BFDBFE' },
  sessionAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: '#3B82F6',
  },
  sessionBody: { flex: 1, paddingVertical: 14, paddingHorizontal: 14, gap: 6 },
  sessionTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sessionSubject: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  stateBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  stateBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  sessionMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sessionMetaText: { fontSize: 13, color: '#6B7280' },
  sessionDot: { fontSize: 13, color: '#D1D5DB', marginHorizontal: 2 },
  sessionChevron: { flexShrink: 0, marginEnd: 12 },

  // Empty state
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },

  // Empty org
  emptyOrgHero: {
    flex: 1,
    backgroundColor: '#2563EB',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyOrgTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  emptyOrgBody: { fontSize: 15, color: '#BFDBFE', textAlign: 'center', lineHeight: 22 },
  emptyOrgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyOrgBtnPressed: { opacity: 0.85 },
  emptyOrgBtnText: { fontSize: 15, fontWeight: '700', color: '#2563EB' },
});
