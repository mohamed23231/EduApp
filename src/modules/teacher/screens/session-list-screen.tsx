/**
 * SessionListScreen — Teacher
 * Phase-9 restyled session template list.
 * FAB bottom-end replaces header "+" button.
 * Cards: standard bg-card border-rule rounded-2xl.
 */

import type { SessionTemplate } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, I18nManager, Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Modal, Text, useModal } from '@/components/ui';
import colors from '@/components/ui/colors';
import { useFeatureFlags } from '@/core/feature-flags/use-feature-flags';
import { AppRoute } from '@/core/navigation/routes';
import { EmptyState, SessionListSkeleton } from '../components';
import { TemplateCard } from '../components/session-list/template-card';
import { getTemplates } from '../services';

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
      <View className="gap-1 px-4 pt-2 pb-4">
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          className="flex-row items-center gap-3 rounded-xl px-4 py-3.5"
          style={({ pressed }) => pressed ? [{ backgroundColor: colors.neutral.paper }] : undefined}
        >
          <View className="size-9 items-center justify-center rounded-xl" style={{ backgroundColor: colors.semantic.infoSoft }}>
            <Ionicons name="create-outline" size={18} color={colors.semantic.info} />
          </View>
          <Text className="flex-1 text-body-lg font-semibold text-ink">
            {t('teacher.sessions.editSession', 'Edit session')}
          </Text>
          <Ionicons
            name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
            size={16}
            color={colors.neutral.dim}
          />
        </Pressable>
        {showRankings && (
          <>
            <View className="mx-4 h-px" style={{ backgroundColor: colors.neutral.rule }} />
            <Pressable
              onPress={onTopStudents}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-xl px-4 py-3.5"
              style={({ pressed }) => pressed ? [{ backgroundColor: colors.neutral.paper }] : undefined}
            >
              <View className="size-9 items-center justify-center rounded-xl" style={{ backgroundColor: colors.semantic.excusedSoft }}>
                <Ionicons name="trophy-outline" size={18} color={colors.semantic.excused} />
              </View>
              <Text className="flex-1 text-body-lg font-semibold text-ink">
                {t('teacher.rankings.topStudents', 'Top students')}
              </Text>
              <Ionicons
                name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                size={16}
                color={colors.neutral.dim}
              />
            </Pressable>
          </>
        )}
      </View>
    </Modal>
  );
}

function ErrorBox({ error, onRetry }: { error: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8">
      <Ionicons name="alert-circle-outline" size={36} color={colors.semantic.absent} />
      <Text className="text-center text-body-lg text-absent">{error}</Text>
      <Pressable
        onPress={onRetry}
        className="rounded-xl px-6 py-2.5"
        style={({ pressed }) => [
          { backgroundColor: colors.semantic.infoSoft },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Text className="text-[14px] font-semibold" style={{ color: colors.semantic.info }}>
          {t('teacher.common.retry', 'Retry')}
        </Text>
      </Pressable>
    </View>
  );
}

// eslint-disable-next-line max-lines-per-function
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
      if (isManualRefresh)
        setIsRefreshing(true);
      setError(null);
      const data = await getTemplates();
      setTemplates(data);
    }
    catch (e) {
      setError(e instanceof Error ? e.message : t('teacher.common.genericError', 'Something went wrong'));
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
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      {/* Header */}
      <View className="flex-row items-center border-b border-rule px-5 py-3.5" style={{ backgroundColor: colors.neutral.card }}>
        <Text className="flex-1 text-[20px] font-bold text-ink">
          {t('teacher.sessions.title', 'Sessions')}
        </Text>
      </View>

      {/* List */}
      {isLoading && templates.length === 0
        ? <SessionListSkeleton />
        : error
          ? <ErrorBox error={error} onRetry={() => void loadTemplates()} />
          : (
              <FlatList
                data={templates}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={[
                  { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100, gap: 10 },
                  templates.length === 0 && { flexGrow: 1 },
                ]}
                ListEmptyComponent={(
                  <EmptyState
                    icon="calendar-outline"
                    title={t('teacher.sessions.emptyTitle', 'No sessions yet')}
                    message={t('teacher.sessions.emptyMessage', 'Create your first session to get started.')}
                    actionLabel={t('teacher.sessions.createTitle', 'Create session')}
                    onAction={handleCreate}
                  />
                )}
                refreshControl={(
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => void loadTemplates(true)}
                    tintColor={colors.brand.primary}
                  />
                )}
              />
            )}

      {/* FAB */}
      <Pressable
        onPress={handleCreate}
        accessibilityRole="button"
        accessibilityLabel={t('teacher.sessions.createTitle', 'Create session')}
        className="absolute bottom-8 size-14 items-center justify-center rounded-full shadow-lg"
        style={({ pressed }) => [
          {
            backgroundColor: pressed ? colors.brand.primaryDeep : colors.brand.primary,
            end: 20,
          },
        ]}
      >
        <Ionicons name="add" size={28} color={colors.neutral.ink} />
      </Pressable>

      <SessionActionsSheet
        sheetRef={actionSheet.ref}
        showRankings={isTeacherPerformanceEnabled}
        onEdit={handleEdit}
        onTopStudents={handleTopStudents}
      />
    </SafeAreaView>
  );
}
