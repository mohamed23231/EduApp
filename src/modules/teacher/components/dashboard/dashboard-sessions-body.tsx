/**
 * DashboardSessionsBody — today's session list with loading / error / empty
 * states, plus the animated per-session row. Extracted from dashboard-screen.
 */

import type { TFunction } from 'i18next';
import type { SessionInstance } from '../../types';
import { MotiView } from 'moti';
import { FlatList, StyleSheet, View } from 'react-native';
import { ErrorState } from '@/components/ui';
import { DashboardSkeleton, EmptyState, SessionCard } from '..';

type DashboardSessionItemProps = {
  item: SessionInstance;
  index: number;
  onStart: (id: string) => void;
  onMarkAttendance: (id: string) => void;
  onEnd: (id: string) => void;
  isStartingId: string | null;
  isEndingId: string | null;
};

export function DashboardSessionItem({ item, index, onStart, onMarkAttendance, onEnd, isStartingId, isEndingId }: DashboardSessionItemProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 220, delay: Math.min(index * 50, 200) }}
    >
      <SessionCard
        instance={item}
        onStartSession={onStart}
        onMarkAttendance={onMarkAttendance}
        onEndSession={onEnd}
        isStarting={isStartingId === item.id}
        isEnding={isEndingId === item.id}
      />
    </MotiView>
  );
}

type DashboardSessionsBodyProps = {
  isInitialLoad: boolean;
  sessionsError: string | null;
  todaySessions: SessionInstance[];
  isLoadingSessions: boolean;
  renderItem: (info: { item: SessionInstance; index: number }) => React.ReactElement;
  onRefetch: () => Promise<void>;
  onCreateSession: () => void;
  t: TFunction;
};

export function DashboardSessionsBody({
  isInitialLoad,
  sessionsError,
  todaySessions,
  isLoadingSessions,
  renderItem,
  onRefetch,
  onCreateSession,
  t,
}: DashboardSessionsBodyProps) {
  if (isInitialLoad)
    return <DashboardSkeleton />;
  if (sessionsError) {
    return (
      <View style={styles.errorBox}>
        <ErrorState
          title={t('teacher.common.errorTitle', 'Something went wrong')}
          body={sessionsError}
          action={{ label: t('teacher.common.retry'), onPress: () => void onRefetch() }}
        />
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

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  listEmpty: { flexGrow: 1 },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
