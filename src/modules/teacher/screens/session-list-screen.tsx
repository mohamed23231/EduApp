/**
 * SessionListScreen — Teacher
 * Polished session template list with RefreshControl,
 * status-aware cards, Moti fade-in rows and skeleton loading.
 */

import type { SessionTemplate } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, I18nManager, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import { EmptyState, SessionListSkeleton } from '../components';
import { getTemplates } from '../services';

function formatDays(days: number[], t: (key: string) => string): string {
  const map: Record<number, string> = {
    1: t('teacher.sessions.weekdays.mon'),
    2: t('teacher.sessions.weekdays.tue'),
    3: t('teacher.sessions.weekdays.wed'),
    4: t('teacher.sessions.weekdays.thu'),
    5: t('teacher.sessions.weekdays.fri'),
    6: t('teacher.sessions.weekdays.sat'),
    7: t('teacher.sessions.weekdays.sun'),
  };
  return days.map(day => map[day] ?? '').filter(Boolean).join(' · ');
}

/** Strip seconds from HH:mm:ss → HH:mm */
function formatTime(time: string): string {
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return time;
}

function TemplateCard({ item, index, onPress }: {
  item: SessionTemplate;
  index: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 240, delay: index * 50 }}
    >
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={onPress}
        accessibilityRole="button"
      >
        {/* Accent stripe */}
        <View style={styles.accent} />

        <View style={styles.cardBody}>
          {/* Subject + time row */}
          <View style={styles.topRow}>
            <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
            <View style={styles.timePill}>
              <Ionicons name="time-outline" size={12} color="#6B7280" />
              <Text style={styles.timeText}>{formatTime(item.time)}</Text>
            </View>
          </View>

          {/* Days row */}
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
            <Text style={styles.metaText}>{formatDays(item.daysOfWeek, t)}</Text>
          </View>

          {/* Students row */}
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={13} color="#9CA3AF" />
            <Text style={styles.metaText}>
              {t('teacher.sessions.studentCount', { count: item.assignedStudents.length })}
            </Text>
          </View>
        </View>

        <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color="#D1D5DB" style={styles.chevron} />
      </Pressable>
    </MotiView>
  );
}

export function SessionListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else if (templates.length === 0) {
        setIsLoading(true);
      }
      setError(null);
      const data = await getTemplates();
      setTemplates(data);
    }
    catch (e) {
      setError(e instanceof Error ? e.message : t('teacher.common.genericError'));
    }
    finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t, templates.length]);

  useFocusEffect(
    useCallback(() => {
      void loadTemplates(false);
    }, [loadTemplates]),
  );

  const handleCreate = useCallback(() => {
    router.push(AppRoute.teacher.sessionCreate as any);
  }, [router]);

  const renderItem = useCallback(
    ({ item, index }: { item: SessionTemplate; index: number }) => (
      <TemplateCard
        item={item}
        index={index}
        onPress={() => router.push(AppRoute.teacher.sessionEdit(item.id) as any)}
      />
    ),
    [router],
  );

  const isInitialLoad = isLoading && templates.length === 0;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('teacher.sessions.title')}</Text>
        <Pressable
          onPress={handleCreate}
          style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel={t('teacher.sessions.createTitle')}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Content */}
      {isInitialLoad
        ? <SessionListSkeleton />
        : error
          ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={36} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                onPress={() => void loadTemplates()}
                style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.retryLabel}>{t('teacher.common.retry')}</Text>
              </Pressable>
            </View>
          )
          : (
            <FlatList
              data={templates}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              contentContainerStyle={[
                styles.list,
                templates.length === 0 && styles.listEmpty,
              ]}
              ListEmptyComponent={(
                <EmptyState
                  icon="calendar-outline"
                  title={t('teacher.sessions.emptyTitle')}
                  message={t('teacher.sessions.emptyMessage')}
                  actionLabel={t('teacher.sessions.createTitle')}
                  onAction={handleCreate}
                />
              )}
              refreshControl={(
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => void loadTemplates(true)}
                  tintColor="#3B82F6"
                />
              )}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnPressed: {
    backgroundColor: '#2563EB',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 10,
  },
  listEmpty: {
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: {
    backgroundColor: '#F0FDF4',
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: '#3B82F6',
  },
  cardBody: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subject: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  chevron: {
    marginEnd: 12,
    flexShrink: 0,
  },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 15,
    color: '#DC2626',
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  retryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
