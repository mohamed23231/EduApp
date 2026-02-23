/**
 * DashboardScreen component
 * Teacher dashboard with today's sessions
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { EmptyState, SessionCard } from '../components';
import { useTodaySessions } from '../hooks';
import { startSession } from '../services';
import { useTeacherStore } from '../store/use-teacher-store';

export function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore.use.user();
  const todaySessions = useTeacherStore.use.todaySessions();
  const isLoadingSessions = useTeacherStore.use.isLoadingSessions();
  const sessionsError = useTeacherStore.use.sessionsError();

  const [isStartingSession, setIsStartingSession] = useState(false);

  const { refetch: refetchSessions } = useTodaySessions();

  useFocusEffect(
    useCallback(() => {
      refetchSessions();
    }, [refetchSessions]),
  );

  const handleStartSession = useCallback(async (sessionId: string) => {
    try {
      setIsStartingSession(true);
      await startSession(sessionId);
      await refetchSessions();
    }
    catch (error) {
      console.error('Failed to start session:', error);
    }
    finally {
      setIsStartingSession(false);
    }
  }, [refetchSessions]);

  const handleMarkAttendance = useCallback((instanceId: string) => {
    router.push(`/attendance/${instanceId}` as any);
  }, [router]);

  const handleRefresh = useCallback(() => {
    refetchSessions();
  }, [refetchSessions]);

  const renderSessionItem = useCallback(({ item }: { item: any }) => (
    <SessionCard
      instance={item}
      onStartSession={handleStartSession}
      onMarkAttendance={handleMarkAttendance}
      isStarting={isStartingSession}
    />
  ), [handleStartSession, handleMarkAttendance, isStartingSession]);

  const renderEmptyState = useCallback(() => (
    <EmptyState
      emoji="📅"
      title={t('teacher.dashboard.emptyTitle')}
      message={t('teacher.dashboard.emptyMessage')}
    />
  ), [t]);

  const renderErrorState = useCallback(() => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{sessionsError}</Text>
      <Button
        label={t('teacher.common.retry')}
        onPress={handleRefresh}
        variant="default"
      />
    </View>
  ), [sessionsError, t, handleRefresh]);

  if (isLoadingSessions && todaySessions.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const userDisplayName = user?.email?.split('@')[0] || 'Teacher';
  const greeting = t('teacher.dashboard.greeting', { name: userDisplayName });

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/sessions/create' as any)}
        >
          <Ionicons name="add-circle" size={28} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {sessionsError ? (
        renderErrorState()
      ) : (
        <FlatList
          data={todaySessions}
          renderItem={renderSessionItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={todaySessions.length === 0 ? styles.listEmpty : undefined}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingSessions}
              onRefresh={handleRefresh}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    padding: 4,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 16,
  },
});
