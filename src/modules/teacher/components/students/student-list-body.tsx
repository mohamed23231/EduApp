/**
 * StudentListBody — list with loading / error / empty / footer states.
 * Extracted from student-list-screen.
 */

import type { Student } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ErrorState } from '@/components/ui';
import { EmptyState, StudentListSkeleton } from '..';

export type StudentFilterKey = 'all' | 'assigned' | 'unassigned';

type StudentListBodyProps = {
  isInitialLoad: boolean;
  error: string | null;
  students: Student[];
  isRefreshing: boolean;
  isPaginating: boolean;
  renderItem: (info: { item: Student; index: number }) => React.ReactElement;
  onRefetch: () => void;
  onAddStudent: () => void;
  onLoadMore: () => void;
  filter: StudentFilterKey;
  t: (key: string) => string;
};

function resolveEmptyCopy(filter: StudentFilterKey, t: (key: string) => string) {
  const title = filter === 'assigned'
    ? t('teacher.students.emptyAssigned')
    : filter === 'unassigned'
      ? t('teacher.students.emptyUnassigned')
      : t('teacher.students.emptyTitle');
  const message = filter === 'all'
    ? t('teacher.students.emptyMessage')
    : t('teacher.students.emptyFilterMessage');
  return { title, message };
}

export function StudentListBody({
  isInitialLoad,
  error,
  students,
  isRefreshing,
  isPaginating,
  renderItem,
  onRefetch,
  onAddStudent,
  onLoadMore,
  filter,
  t,
}: StudentListBodyProps) {
  if (isInitialLoad) {
    return <StudentListSkeleton />;
  }
  if (error) {
    return (
      <View style={styles.errorBox}>
        <ErrorState
          title={t('teacher.common.errorTitle')}
          body={error}
          action={{ label: t('teacher.common.retry'), onPress: onRefetch }}
        />
      </View>
    );
  }

  const { title, message } = resolveEmptyCopy(filter, t);
  const footerComponent = isPaginating
    ? (
        <View style={styles.footerLoader}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
        </View>
      )
    : null;

  return (
    <FlatList
      data={students}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      contentContainerStyle={[styles.list, students.length === 0 && styles.listEmpty]}
      ListEmptyComponent={(
        <EmptyState
          icon={filter === 'unassigned' ? 'checkmark-circle-outline' : 'people-outline'}
          title={title}
          message={message}
          actionLabel={filter === 'all' ? t('teacher.students.createButton') : undefined}
          onAction={filter === 'all' ? onAddStudent : undefined}
        />
      )}
      ListFooterComponent={footerComponent}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.4}
      refreshControl={(
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefetch} tintColor="#3B82F6" />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  listEmpty: { flexGrow: 1 },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
});
