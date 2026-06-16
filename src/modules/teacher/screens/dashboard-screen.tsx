/**
 * DashboardScreen — Teacher
 * Compact hero, quick actions, today's sessions with end-session support.
 * Confirmation sheet before ending a session.
 */

import type { SessionInstance } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { AppRoute } from '@/core/navigation/routes';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { ContextSwitcher } from '@/modules/organization/shared/components/context-switcher';
import { useContexts } from '@/modules/organization/shared/hooks/use-contexts';
import { useOrgContextStore } from '@/modules/organization/shared/store/org-context-store';
import { ConfirmSheet } from '../components';
import { ContextPill, OrgCards } from '../components/dashboard/dashboard-context';
import { DashboardHero } from '../components/dashboard/dashboard-hero';
import { DashboardQuickActions } from '../components/dashboard/dashboard-quick-actions';
import { DashboardSessionItem, DashboardSessionsBody } from '../components/dashboard/dashboard-sessions-body';
import { useTodaySessions } from '../hooks';
import { useHydrateTeacherName } from '../hooks/use-hydrate-teacher-name';
import { useSessionActions } from '../hooks/use-session-actions';
import { useTeacherStore } from '../store/use-teacher-store';
import { getDashboardFirstName } from '../utils/dashboard-name';

export function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore.use.user();
  const todaySessions = useTeacherStore.use.todaySessions();
  const isLoadingSessions = useTeacherStore.use.isLoadingSessions();
  const sessionsError = useTeacherStore.use.sessionsError();
  const [hasLoaded, setHasLoaded] = useState(false);
  const lastFetchRef = useRef(0);
  const { refetch: refetchSessions } = useTodaySessions();
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const { data: contextsData } = useContexts();
  const activeContext = useOrgContextStore.use.activeContext();
  const activeOrgId = useOrgContextStore.use.activeOrgId();
  const { isStartingId, isEndingId, confirmEndModal, handleStartSession, handleEndSessionRequest, handleEndSessionConfirm, handleMarkAttendance, handleCancelEnd } = useSessionActions(refetchSessions);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFetchRef.current > 2000) {
        lastFetchRef.current = now;
        refetchSessions().then(() => setHasLoaded(true));
      }
    }, [refetchSessions]),
  );

  useHydrateTeacherName(user);

  const renderItem = useCallback(
    ({ item, index }: { item: SessionInstance; index: number }) => (
      <DashboardSessionItem item={item} index={index} onStart={handleStartSession} onMarkAttendance={handleMarkAttendance} onEnd={handleEndSessionRequest} isStartingId={isStartingId} isEndingId={isEndingId} />
    ),
    [handleStartSession, handleMarkAttendance, handleEndSessionRequest, isStartingId, isEndingId],
  );

  const firstName = getDashboardFirstName(user?.fullName, user?.email, t);
  const activeCount = todaySessions.filter(s => s.state === 'ACTIVE').length;
  const isInitialLoad = isLoadingSessions && !hasLoaded;
  const orgs = contextsData?.organizations ?? [];
  const activeOrgName = orgs.find(o => o.organizationId === activeOrgId)?.name;
  const pillLabel = activeContext === 'personal' ? t('contextSwitcher.personal') : (activeOrgName ?? t('contextSwitcher.orgContext'));

  const handleSelectOrg = useCallback((orgId: string) => {
    const org = contextsData?.organizations.find(o => o.organizationId === orgId);
    router.push({ pathname: '/(teacher)/org-sessions' as any, params: { orgId, orgName: org?.name ?? '' } });
  }, [contextsData, router]);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Animated.View entering={FadeInDown.delay(0).duration(350)}>
        <DashboardHero firstName={firstName} sessionCount={todaySessions.length} activeCount={activeCount} t={t} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(100).duration(350)}>
        <DashboardQuickActions onCreateStudent={() => router.push(AppRoute.teacher.studentCreate as any)} onCreateSession={() => router.push(AppRoute.teacher.sessionCreate as any)} t={t} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(140).duration(350)}>
        <ContextPill onPress={() => setSwitcherVisible(true)} label={pillLabel} />
      </Animated.View>
      {orgs.length > 0 && (
        <Animated.View entering={FadeInDown.delay(160).duration(350)}>
          <OrgCards orgs={orgs} onSelect={handleSelectOrg} t={t} />
        </Animated.View>
      )}
      <Animated.View entering={FadeInDown.delay(180).duration(350)}>
        <View style={styles.sectionHeader}>
          <Ionicons name="today-outline" size={14} color={colors.neutral.inkMuted} />
          <Text style={styles.sectionTitle}>{t('teacher.dashboard.sessionsTitle')}</Text>
        </View>
      </Animated.View>
      <DashboardSessionsBody isInitialLoad={isInitialLoad} sessionsError={sessionsError} todaySessions={todaySessions} isLoadingSessions={isLoadingSessions} renderItem={renderItem} onRefetch={refetchSessions} onCreateSession={() => router.push(AppRoute.teacher.sessionCreate as any)} t={t} />
      <ConfirmSheet ref={confirmEndModal.ref} title={t('teacher.sessions.endSession')} message={t('teacher.sessions.endSessionConfirm')} confirmLabel={t('teacher.sessions.endSession')} cancelLabel={t('teacher.common.cancel')} onConfirm={handleEndSessionConfirm} onCancel={handleCancelEnd} variant="destructive" />
      <ContextSwitcher visible={switcherVisible} userRole={user?.role ?? null} orgs={orgs} onClose={() => setSwitcherVisible(false)} onSelectOrg={handleSelectOrg} onSelectPersonal={() => setSwitcherVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral.paper },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
