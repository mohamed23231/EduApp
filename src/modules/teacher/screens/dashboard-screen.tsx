/**
 * DashboardScreen — Teacher
 * Compact hero, quick actions, today's sessions with end-session support.
 * Confirmation sheet before ending a session.
 */

import type { SessionInstance } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { ConfirmSheet, DashboardSkeleton, EmptyState, SessionCard } from '../components';
import { useTodaySessions } from '../hooks';
import { useSessionActions } from '../hooks/use-session-actions';
import { useTeacherStore } from '../store/use-teacher-store';

function getGreeting(t: (key: string) => string) {
  const hour = new Date().getHours();
  if (hour < 12)
    return t('teacher.dashboard.goodMorning');
  if (hour < 17)
    return t('teacher.dashboard.goodAfternoon');
  return t('teacher.dashboard.goodEvening');
}

function DashboardHero({
  firstName,
  sessionCount,
  activeCount,
  t,
}: {
  firstName: string;
  sessionCount: number;
  activeCount: number;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroTop}>
        <View style={styles.heroLeft}>
          <Text style={styles.greetingText}>{getGreeting(t)}</Text>
          <Text style={styles.heroName} numberOfLines={1}>{firstName}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{firstName[0]?.toUpperCase() ?? '?'}</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{sessionCount}</Text>
          <Text style={styles.statLabel}>{t('teacher.dashboard.sessionsToday')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{activeCount}</Text>
          <Text style={styles.statLabel}>{t('teacher.dashboard.activeSessions')}</Text>
        </View>
      </View>
    </View>
  );
}

function QuickActions({
  onCreateStudent,
  onCreateSession,
  t,
}: {
  onCreateStudent: () => void;
  onCreateSession: () => void;
  t: (key: string) => string;
}) {
  return (
    <View style={styles.actionsGrid}>
      <QuickActionCard
        icon="person-add-outline"
        label={t('teacher.students.createButton')}
        onPress={onCreateStudent}
        iconBg="#EDE9FE"
        iconColor="#7C3AED"
      />
      <QuickActionCard
        icon="calendar-outline"
        label={t('teacher.sessions.createTitle')}
        onPress={onCreateSession}
        iconBg="#DBEAFE"
        iconColor="#2563EB"
      />
    </View>
  );
}

function QuickActionCard({ icon, label, onPress, iconBg, iconColor }: {
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
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={styles.actionLabel} numberOfLines={1}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function SessionsBody({
  isInitialLoad,
  sessionsError,
  todaySessions,
  isLoadingSessions,
  renderItem,
  onRefetch,
  onCreateSession,
  t,
}: {
  isInitialLoad: boolean;
  sessionsError: string | null;
  todaySessions: SessionInstance[];
  isLoadingSessions: boolean;
  renderItem: (info: { item: SessionInstance; index: number }) => React.ReactElement;
  onRefetch: () => Promise<void>;
  onCreateSession: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  if (isInitialLoad)
    return <DashboardSkeleton />;
  if (sessionsError) {
    return (
      <View style={styles.errorBox}>
        <Ionicons name="alert-circle-outline" size={36} color="#DC2626" />
        <Text style={styles.errorText}>{sessionsError}</Text>
        <Pressable onPress={onRefetch} style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}>
          <Text style={styles.retryLabel}>{t('teacher.common.retry')}</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <FlatList
      data={todaySessions}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      removeClippedSubviews
      contentContainerStyle={[styles.list, todaySessions.length === 0 && styles.listEmpty]}
      onRefresh={onRefetch}
      refreshing={isLoadingSessions && todaySessions.length > 0}
      ListEmptyComponent={(
        <EmptyState
          icon="calendar-outline"
          title={t('teacher.dashboard.emptyTitle')}
          message={t('teacher.dashboard.emptyMessage')}
          actionLabel={t('teacher.sessions.createTitle')}
          onAction={onCreateSession}
        />
      )}
    />
  );
}

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

  const {
    isStartingId,
    isEndingId,
    confirmEndModal,
    handleStartSession,
    handleEndSessionRequest,
    handleEndSessionConfirm,
    handleMarkAttendance,
    handleCancelEnd,
  } = useSessionActions(refetchSessions);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFetchRef.current > 2000) {
        lastFetchRef.current = now;
        refetchSessions().then(() => setHasLoaded(true));
      }
    }, [refetchSessions]),
  );

  const renderItem = useCallback(
    ({ item, index }: { item: SessionInstance; index: number }) => (
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 220, delay: Math.min(index * 50, 200) }}
      >
        <SessionCard
          instance={item}
          onStartSession={handleStartSession}
          onMarkAttendance={handleMarkAttendance}
          onEndSession={handleEndSessionRequest}
          isStarting={isStartingId === item.id}
          isEnding={isEndingId === item.id}
        />
      </MotiView>
    ),
    [handleStartSession, handleMarkAttendance, handleEndSessionRequest, isStartingId, isEndingId],
  );

  const firstName = user?.email?.split('@')[0] ?? t('teacher.dashboard.title');
  const activeCount = todaySessions.filter(s => s.state === 'ACTIVE').length;
  const isInitialLoad = isLoadingSessions && !hasLoaded;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Animated.View entering={FadeInDown.delay(0).duration(350)}>
        <DashboardHero
          firstName={firstName}
          sessionCount={todaySessions.length}
          activeCount={activeCount}
          t={t}
        />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(100).duration(350)}>
        <QuickActions
          onCreateStudent={() => router.push(AppRoute.teacher.studentCreate as any)}
          onCreateSession={() => router.push(AppRoute.teacher.sessionCreate as any)}
          t={t}
        />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(180).duration(350)}>
        <View style={styles.sectionHeader}>
          <Ionicons name="today-outline" size={14} color="#6B7280" />
          <Text style={styles.sectionTitle}>{t('teacher.dashboard.sessionsTitle')}</Text>
        </View>
      </Animated.View>
      <SessionsBody
        isInitialLoad={isInitialLoad}
        sessionsError={sessionsError}
        todaySessions={todaySessions}
        isLoadingSessions={isLoadingSessions}
        renderItem={renderItem}
        onRefetch={refetchSessions}
        onCreateSession={() => router.push(AppRoute.teacher.sessionCreate as any)}
        t={t}
      />
      <ConfirmSheet
        ref={confirmEndModal.ref}
        title={t('teacher.sessions.endSession')}
        message={t('teacher.sessions.endSessionConfirm')}
        confirmLabel={t('teacher.sessions.endSession')}
        cancelLabel={t('teacher.common.cancel')}
        onConfirm={handleEndSessionConfirm}
        onCancel={handleCancelEnd}
        variant="destructive"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  hero: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
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
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151' },
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
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  listEmpty: { flexGrow: 1 },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  errorText: { fontSize: 15, color: '#DC2626', textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  retryLabel: { fontSize: 14, fontWeight: '600', color: '#3B82F6' },
});
