/**
 * SessionListScreen — Teacher
 * Polished session template list with RefreshControl,
 * status-aware cards, Moti fade-in rows and skeleton loading.
 */

import type { SessionTemplate } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, I18nManager, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Modal, Text, useModal } from '@/components/ui';
import { useFeatureFlags } from '@/core/feature-flags/use-feature-flags';
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
        <View style={styles.accent} />
        <View style={styles.cardBody}>
          <View style={styles.topRow}>
            <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
            <View style={styles.timePill}>
              <Ionicons name="time-outline" size={12} color="#6B7280" />
              <Text style={styles.timeText}>{formatTime(item.time)}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
            <Text style={styles.metaText}>{formatDays(item.daysOfWeek, t)}</Text>
          </View>
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

function SessionActionsSheet({
  sheetRef,
  showRankings,
  onEdit,
  onTopStudents,
}: {
  sheetRef: ReturnType<typeof useModal>['ref'];
  showRankings: boolean;
  onEdit: () => void;
  onTopStudents: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Modal ref={sheetRef} snapPoints={[showRankings ? 165 : 100]}>
      <View style={styles.actionSheet}>
        <Pressable
          style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
          onPress={onEdit}
          accessibilityRole="button"
        >
          <View style={styles.actionIcon}>
            <Ionicons name="create-outline" size={18} color="#2563EB" />
          </View>
          <Text style={styles.actionText}>{t('teacher.sessions.editSession')}</Text>
          <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color="#93C5FD" />
        </Pressable>
        <View style={styles.actionDivider} />
        {showRankings && (
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
            onPress={onTopStudents}
            accessibilityRole="button"
          >
            <View style={[styles.actionIcon, styles.actionIconGold]}>
              <Ionicons name="trophy-outline" size={18} color="#D97706" />
            </View>
            <Text style={styles.actionText}>{t('teacher.rankings.topStudents')}</Text>
            <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color="#93C5FD" />
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

function SessionListContent({
  isLoading,
  error,
  templates,
  renderItem,
  isRefreshing,
  onRefresh,
  onRetry,
  onCreate,
}: {
  isLoading: boolean;
  error: string | null;
  templates: SessionTemplate[];
  renderItem: any;
  isRefreshing: boolean;
  onRefresh: () => void;
  onRetry: () => void;
  onCreate: () => void;
}) {
  const { t } = useTranslation();

  if (isLoading && templates.length === 0) {
    return <SessionListSkeleton />;
  }
  if (error) {
    return (
      <View style={styles.errorBox}>
        <Ionicons name="alert-circle-outline" size={36} color="#DC2626" />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.retryLabel}>{t('teacher.common.retry')}</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <FlatList
      data={templates}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      contentContainerStyle={[styles.list, templates.length === 0 && styles.listEmpty]}
      ListEmptyComponent={(
        <EmptyState
          icon="calendar-outline"
          title={t('teacher.sessions.emptyTitle')}
          message={t('teacher.sessions.emptyMessage')}
          actionLabel={t('teacher.sessions.createTitle')}
          onAction={onCreate}
        />
      )}
      refreshControl={(
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#3B82F6"
        />
      )}
    />
  );
}

export function SessionListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedTemplateId = useRef<string | null>(null);
  const actionSheet = useModal();
  const { isTeacherPerformanceEnabled } = useFeatureFlags();

  const loadTemplates = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
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
  }, [t]);

  useFocusEffect(useCallback(() => {
    void loadTemplates(false);
  }, [loadTemplates]));

  const handleCreate = useCallback(() => {
    router.push(AppRoute.teacher.sessionCreate as any);
  }, [router]);

  const handleCardPress = useCallback((id: string) => {
    selectedTemplateId.current = id;
    actionSheet.present();
  }, [actionSheet]);

  const handleEdit = useCallback(() => {
    actionSheet.dismiss();
    if (selectedTemplateId.current) {
      router.push(AppRoute.teacher.sessionEdit(selectedTemplateId.current) as any);
    }
  }, [actionSheet, router]);

  const handleTopStudents = useCallback(() => {
    actionSheet.dismiss();
    if (selectedTemplateId.current) {
      router.push(AppRoute.teacher.sessionRankings(selectedTemplateId.current) as any);
    }
  }, [actionSheet, router]);

  const renderItem = useCallback(
    ({ item, index }: { item: SessionTemplate; index: number }) => (
      <TemplateCard item={item} index={index} onPress={() => handleCardPress(item.id)} />
    ),
    [handleCardPress],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
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

      <SessionListContent
        isLoading={isLoading}
        error={error}
        templates={templates}
        renderItem={renderItem}
        isRefreshing={isRefreshing}
        onRefresh={() => void loadTemplates(true)}
        onRetry={() => void loadTemplates()}
        onCreate={handleCreate}
      />

      <SessionActionsSheet
        sheetRef={actionSheet.ref}
        showRankings={isTeacherPerformanceEnabled}
        onEdit={handleEdit}
        onTopStudents={handleTopStudents}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: '#111827' },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnPressed: { backgroundColor: '#2563EB' },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, gap: 10 },
  listEmpty: { flexGrow: 1 },
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
  cardPressed: { backgroundColor: '#F0FDF4' },
  accent: { width: 4, alignSelf: 'stretch', backgroundColor: '#3B82F6' },
  cardBody: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, gap: 5 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subject: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  timeText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: '#6B7280' },
  chevron: { marginEnd: 12, flexShrink: 0 },
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
  actionSheet: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 4 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionRowPressed: { backgroundColor: '#F3F4F6' },
  actionText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconGold: { backgroundColor: '#FEF3C7' },
  actionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
});
